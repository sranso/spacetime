'use strict';
global.PackData = {};
(function () {

var blobPrefix = Convert.stringToArray('blob ');
var treePrefix = Convert.stringToArray('tree ');
var commitPrefix = Convert.stringToArray('commit ');

var pakoOptions = {level: 6, chunkSize: 4096};
var maxPackHeaderSize = 8;

var resizePack = function () {
    var newPack = new Uint8Array($pack.length * 2);
    var i;
    for (i = 0; i < $pack.length; i++) {
        newPack[i] = $pack[i];
    }

    global.$pack = newPack;
};

PackData.packFile = function (packOffset, fileLength) {
    var contentStart = $file.indexOf(0, 5) + 1;
    var length = fileLength - contentStart;

    var typeBits;
    if ($file[0] === blobPrefix[0]) {
        typeBits = 0x30;
    } else if ($file[1] === treePrefix[1]) {
        typeBits = 0x20;
    } else if ($file[0] === commitPrefix[0]) {
        typeBits = 0x10;
    } else {
        throw new Error('Unknown type: ' + $file.slice(0, 4).join(','));
    }

    if (packOffset + maxPackHeaderSize > $pack.length) {
        resizePack();
    }
    var c = typeBits | (length & 0xf);

    length >>>= 4;
    while (length) {
        $pack[packOffset] = c | 0x80;
        c = length & 0x7f;
        length >>>= 7;
        packOffset++;
    }
    $pack[packOffset] = c;
    packOffset++;

    var deflate = new pako.Deflate(pakoOptions);
    deflate.onData = onDeflateData;
    deflate.onEnd = onEnd;
    deflate.packOffset = packOffset;
    deflate.push($file.subarray(contentStart, fileLength), true);

    return deflate.packOffset;
};

var onDeflateData = function (chunk) {
    var packOffset = this.packOffset;
    if (packOffset + chunk.length > $pack.length) {
        resizePack();
    }
    var i;
    for (i = 0; i < chunk.length; i++) {
        $pack[packOffset + i] = chunk[i];
    }
    this.packOffset += i;
};

var onEnd = function (status) {
    if (status !== 0) throw new Error(this.strm.msg);
}

PackData.extractFile = function (pack, packOffset, extractFileOutput) {
    var pack_j = packOffset;
    var typeBits = pack[pack_j] & 0x70;
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

    var length = pack[pack_j] & 0xf;
    var shift = 4;
    while (pack[pack_j] & 0x80) {
        pack_j++;
        length |= (pack[pack_j] & 0x7f) << shift;
        shift += 7;
    }
    pack_j++;

    var lengthString = '' + length;
    var fileLength = prefix.length + lengthString.length + 1 + length;

    var i;
    for (i = 0; i < prefix.length; i++) {
        $file[i] = prefix[i];
    }

    var j = i;
    for (i = 0; i < lengthString.length; i++) {
        $file[j + i] = lengthString.charCodeAt(i);
    }
    $file[j + i] = 0;

    j += i + 1;

    var inflate = new pako.Inflate(pakoOptions);
    inflate.j = j;
    inflate.onData = onInflateData;
    inflate.onEnd = onEnd;

    inflate.push(pack.subarray(pack_j), true);

    var nextPackOffset = pack_j + inflate.strm.next_in;
    extractFileOutput[0] = fileLength;
    extractFileOutput[1] = nextPackOffset;
};

var onInflateData = function (chunk) {
    var j = this.j;
    var i;
    for (i = 0; i < chunk.length; i++) {
        $file[j + i] = chunk[i];
    }
    this.j += i;
};

})();
