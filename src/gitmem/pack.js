'use strict';
global.Pack = {};
(function () {

Pack.create = function (files) {
    var pack = new Uint8Array(512);
    pack[0] = 0x50; // P
    pack[1] = 0x41; // A
    pack[2] = 0x43; // C
    pack[3] = 0x4b; // K

    pack[7] = 2;

    pack[8] = files.length >>> 24;
    pack[9] = (files.length >>> 16) & 0xff;
    pack[10] = (files.length >>> 8) & 0xff;
    pack[11] = files.length & 0xff;
    var j = 12;

    var f;
    for (f = 0; f < files.length; f++) {
        // Assume deflated length + header is less than 100
        // bytes over file length (inflated with type header).
        while (pack.length - j < files[f].length + 100) {
            if (pack.length < 32768) {
                var newLength = pack.length * 2;
            } else {
                var newLength = 8192 * (((pack.length * 1.5) >>> 13) + 1);
            }
            var newPack = new Uint8Array(newLength);
            var i;
            for (i = 0; i < pack.length; i++) {
                newPack[i] = pack[i];
            }
            pack = newPack;
        }
        j += Pack._packFile(pack, j, files[f]);
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

Pack._packFile = function (pack, packOffset, file) {
    var i = file.indexOf(0x20, 4);
    var type = String.fromCharCode.apply(null, file.subarray(0, i));
    i = file.indexOf(0, j) + 1;
    var length = file.length - i;

    if (length < 32768) {
        // Try to only need one chunk.
        var chunkSize = 4096 * ((length >>> 13) + 1);
    } else {
        // Shoot for 1/4 of the inflated size to reduce overhead.
        var chunkSize = 8192 * (((length / 4) >>> 13) + 1);
    }

    var typeBits;
    if (type === 'blob') {
        typeBits = 0x30;
    } else if (type === 'tree') {
        typeBits = 0x20;
    } else if (type === 'commit') {
        typeBits = 0x10;
    } else {
        throw new Error('Unknown type: ' + type);
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
    deflate.onData = deflateOnData;
    deflate.j = j;
    deflate.pack = pack;
    deflate.onEnd = deflateOnEnd;

    deflate.push(file.subarray(i), true);

    return deflate.j - packOffset;
};

var deflateOnData = function (chunk) {
    var j = this.j;
    var pack = this.pack;
    var i;
    for (i = 0; i < chunk.length; i++) {
        pack[j + i] = chunk[i];
    }
    this.j += i;
};

var deflateOnEnd = function (status) {
    if (status !== 0) throw new error(this.strm.msg);
}

Pack.valid = function (pack) {
    var packContent = pack.subarray(0, pack.length - 20);
    var packHashComputed = new Uint8Array(20);
    Sha1.hash(packContent, packHashComputed, 0);

    if (!GitFile.hashEqual(pack, pack.length - 20, packHashComputed, 0)) {
        return false;
    }

    if (
        pack[0] !== 0x50 || // P
        pack[1] !== 0x41 || // A
        pack[2] !== 0x43 || // C
        pack[3] !== 0x4b    // K
    ) {
        return false;
    }

    if (pack[7] !== 2) {
        return false;
    }
    return true;
};

})();
