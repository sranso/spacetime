'use strict';
global.Pack = {};
(function () {

Pack.create = function (files) {
    var pack = new Uint8Array(512);
    pack[0] = 'P'.charCodeAt(0);
    pack[1] = 'A'.charCodeAt(0);
    pack[2] = 'C'.charCodeAt(0);
    pack[3] = 'K'.charCodeAt(0);

    pack[4] = 0;
    pack[5] = 0;
    pack[6] = 0;
    pack[7] = 2;

    pack[8] = files.length >>> 24;
    pack[9] = (files.length >>> 16) & 0xff;
    pack[10] = (files.length >>> 8) & 0xff;
    pack[11] = files.length & 0xff;
    var j = 12;

    var f;
    for (f = 0; f < files.length; f++) {
        // Guess that deflated length + header is less than 100
        // bytes over file length (inflated with type header).
        var targetLength = j + files[f].length + 100;
        if (pack.length < targetLength) {
            pack = resizePack(pack, targetLength);
        }

        var jOrNegativeNeededSpace = Pack._packFile(pack, j, files[f]);
        if (jOrNegativeNeededSpace < 0) {
            pack = resizePack(pack, pack.length + -jOrNegativeNeededSpace);
            j = Pack._packFile(pack, j, files[f]);
        } else {
            j = jOrNegativeNeededSpace;
        }
    }

    var remaining = pack.length - j;
    if (remaining < 20) {
        var newPack = new Uint8Array(pack.length + 20 - remaining);
        var i;
        for (i = 0; i < pack.length; i++) {
            newPack[i] = pack[i];
        }
        pack = newPack;
    }

    Sha1.hash(pack.subarray(0, j), pack, j);

    return pack.subarray(0, j + 20);
}

var resizePack = function (pack, targetLength) {
    var newLength = pack.length;
    while (newLength < targetLength) {
        if (newLength < 32768) {
            var newLength = pack.length * 2;
        } else {
            var newLength = 8192 * (((pack.length * 1.5) >>> 13) + 1);
        }
    }

    var newPack = new Uint8Array(newLength);
    var i;
    for (i = 0; i < pack.length; i++) {
        newPack[i] = pack[i];
    }

    return newPack;
}

var blobPrefix = GitFile.stringToArray('blob ');
var treePrefix = GitFile.stringToArray('tree ');
var commitPrefix = GitFile.stringToArray('commit ');

Pack._packFile = function (pack, packOffset, file) {
    var i = file.indexOf(0, j) + 1;
    var length = file.length - i;

    if (length < 32768) {
        // Try to only need one chunk.
        var chunkSize = 4096 * ((length >>> 13) + 1);
    } else {
        // Shoot for 1/4 of the inflated size to reduce overhead.
        var chunkSize = 8192 * (((length / 4) >>> 13) + 1);
    }

    var typeBits;
    if (file[0] === blobPrefix[0]) {
        typeBits = 0x30;
    } else if (file[1] === treePrefix[1]) {
        typeBits = 0x20;
    } else if (file[0] === commitPrefix[0]) {
        typeBits = 0x10;
    } else {
        throw new Error('Unknown type: ' + file.slice(0, 4).join(','));
    }

    var c = typeBits | (length & 0xf);
    var j = packOffset;

    length >>= 4;
    while (length) {
        pack[j] = c | 0x80;
        c = length & 0x7f;
        length >>= 7;
        j++;
    }
    pack[j] = c;
    j++;

    var deflate = new pako.Deflate({level: 6, chunkSize: chunkSize});
    deflate.onData = onDeflateData;
    deflate.onEnd = onEnd;
    deflate.dataOffset = j;
    deflate.dataArray = pack;
    deflate.neededSpace = 0;

    deflate.push(file.subarray(i), true);

    if (deflate.neededSpace) {
        return -deflate.neededSpace;
    } else {
        return deflate.dataOffset;
    }
};

var onDeflateData = function (chunk) {
    var j = this.dataOffset;
    var array = this.dataArray;
    var capacity = array.length - j;
    var neededSpace = chunk.length - capacity;
    if (neededSpace > 0) {
        this.neededSpace += neededSpace;
        this.dataOffset = array.length;
        return;
    }

    var i;
    for (i = 0; i < chunk.length; i++) {
        array[j + i] = chunk[i];
    }
    this.dataOffset += i;
};

var onEnd = function (status) {
    if (status !== 0) throw new Error(this.strm.msg);
}

Pack.extractFile = function (pack, packOffset, file, fileOffset) {
    var k = packOffset;
    var typeBits = pack[k] & 0x70;
    var prefix;
    if (typeBits === 0x30) {
        prefix = blobPrefix;
    } else if (typeBits === 0x20) {
        prefix = treePrefix;
    } else if (typeBits === 0x10) {
        prefix = commitPrefix;
    } else {
        throw new Error('Unknown type: 0x' + typeBits.toString(16));
    }

    var length = pack[k] & 0xf;
    var shift = 4;
    while (pack[k] & 0x80) {
        k++;
        length |= (pack[k] & 0x7f) << shift;
        shift += 7;
    }
    k++;

    var lengthString = '' + length;
    var fileLength = prefix.length + lengthString.length + 1 + length;
    if (file.length - fileOffset < fileLength) {
        return [0, fileLength];
    }

    var j = fileOffset;
    var i;
    for (i = 0; i < prefix.length; i++) {
        file[j + i] = prefix[i];
    }

    j += i;
    for (i = 0; i < lengthString.length; i++) {
        file[j + i] = lengthString.charCodeAt(i);
    }

    j += i + 1;

    if (length < 32768) {
        // Try to only need one chunk.
        var chunkSize = 4096 * ((length >>> 13) + 1);
    } else {
        // Shoot for 1/4 of the inflated size to reduce overhead.
        var chunkSize = 8192 * (((length / 4) >>> 13) + 1);
    }

    var inflate = new pako.Inflate({chunkSize: chunkSize});
    inflate.onData = onInflateData;
    inflate.onEnd = onEnd;
    inflate.dataOffset = j;
    inflate.dataArray = file;

    inflate.push(pack.subarray(k), true);

    return [k + inflate.strm.next_in, inflate.dataOffset];
};

var onInflateData = function (chunk) {
    var j = this.dataOffset;
    var array = this.dataArray;
    var i;
    for (i = 0; i < chunk.length; i++) {
        array[j + i] = chunk[i];
    }
    this.dataOffset += i;
};

Pack.validate = function (pack) {
    if (pack.length < 22) {
        return 'pack length is too short';
    }

    if (
        pack[0] !== 'P'.charCodeAt(0) ||
        pack[1] !== 'A'.charCodeAt(0) ||
        pack[2] !== 'C'.charCodeAt(0) ||
        pack[3] !== 'K'.charCodeAt(0)
    ) {
        return 'incorrect pack prefix';
    }

    if (pack[7] !== 2) {
        return 'unsupported pack version number (not 2)';
    }

    var packContent = pack.subarray(0, pack.length - 20);
    var packHashComputed = new Uint8Array(20);
    Sha1.hash(packContent, packHashComputed, 0);

    if (!GitFile.hashEqual(pack, pack.length - 20, packHashComputed, 0)) {
        return 'incorrect pack hash';
    }

    return null;
};

})();
