'use strict';
global.PackData = {};
(function () {

var blobPrefix = Convert.stringToArray('blob ');
var treePrefix = Convert.stringToArray('tree ');
var commitPrefix = Convert.stringToArray('commit ');

var pakoOptions = {level: 6, chunkSize: 4096};
var maxPackHeaderSize = 8;
var packExtraSize = maxPackHeaderSize + 20; // SHA-1 at end of pack

PackData.packFile = function (packOffset, file, fileStart, fileEnd) {
    var contentStart = file.indexOf(0, fileStart + 5) + 1;
    var length = fileEnd - contentStart;

    var typeBits;
    if (file[fileStart] === blobPrefix[0]) {
        typeBits = 0x30;
    } else if (file[fileStart + 1] === treePrefix[1]) {
        typeBits = 0x20;
    } else if (file[fileStart] === commitPrefix[0]) {
        typeBits = 0x10;
    } else {
        throw new Error('Unknown type: ' + file.slice(fileStart, fileStart + 4).join(','));
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
    deflate.onData = onData;
    deflate.onEnd = onEnd;
    deflate.array = $pack;
    deflate.j = packOffset;
    deflate.push(file.subarray(contentStart, fileEnd), true);

    return deflate.j;
};

var onData = function (chunk) {
    var i;
    for (i = 0; i < chunk.length; i++) {
        this.array[this.j + i] = chunk[i];
    }
    this.j += i;
};

var onEnd = function (status) {
    if (status !== 0) {
        throw new Error(this.strm.msg);
    }
};

PackData.extractFile = function (pack, packOffset, extractFileOutput) {
    var typeBits = pack[packOffset] & 0x70;
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

    var length = pack[packOffset] & 0xf;
    var shift = 4;
    while (pack[packOffset] & 0x80) {
        packOffset++;
        length |= (pack[packOffset] & 0x7f) << shift;
        shift += 7;
    }
    packOffset++;

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
    inflate.onData = onData;
    inflate.onEnd = onEnd;
    inflate.array = $file;
    inflate.j = j;

    inflate.push(pack.subarray(packOffset), true);

    var nextPackOffset = packOffset + inflate.strm.next_in;
    extractFileOutput[0] = fileLength;
    extractFileOutput[1] = nextPackOffset;
};

})();
