'use strict';
global.PackData = {};
(function () {

var blobPrefix = GitConvert.stringToArray('blob ');
var treePrefix = GitConvert.stringToArray('tree ');
var commitPrefix = GitConvert.stringToArray('commit ');

PackData.create = function (capacity) {
    return Heap.create(capacity);
};

var maxPackHeaderSize = 8;

PackData.resize = function (packData, mallocSize) {
    var capacity = packData.capacity;
    var minimumCapacity = packData.nextOffset + mallocSize;
    capacity *= 2;
    while (capacity < minimumCapacity) {
        capacity *= 2;
    }

    var oldArray = packData.array;
    var array = new Uint8Array(capacity);
    var i;
    for (i = 0; i < packData.nextOffset; i++) {
        array[i] = oldArray[i];
    }

    packData.array = array;
    packData.capacity = capacity;
};

PackData.packFile = function (packData, fileStart, fileEnd) {
    var contentStart = $.indexOf(0, fileStart + 5) + 1;
    var length = fileEnd - contentStart;

    if (length < 32768) {
        // Try to only need one chunk.
        var chunkSize = 4096 * ((length >>> 13) + 1);
    } else {
        // Shoot for 1/4 of the inflated size to reduce overhead.
        var chunkSize = 8192 * (((length / 4) >>> 13) + 1);
    }

    var typeBits;
    if ($[fileStart] === blobPrefix[0]) {
        typeBits = 0x30;
    } else if ($[fileStart + 1] === treePrefix[1]) {
        typeBits = 0x20;
    } else if ($[fileStart] === commitPrefix[0]) {
        typeBits = 0x10;
    } else {
        throw new Error('Unknown type: ' + $.slice(fileStart, fileStart + 4).join(','));
    }

    if (packData.nextOffset + maxPackHeaderSize > packData.capacity) {
        PackData.resize(packData, maxPackHeaderSize);
    }
    var deflatedOffset = packData.nextOffset;
    var c = typeBits | (length & 0xf);

    length >>= 4;
    while (length) {
        packData.array[packData.nextOffset] = c | 0x80;
        c = length & 0x7f;
        length >>= 7;
        packData.nextOffset++;
    }
    packData.array[packData.nextOffset] = c;
    packData.nextOffset++;

    var deflate = new pako.Deflate({level: 6, chunkSize: chunkSize});
    deflate.onData = onDeflateData;
    deflate.onEnd = onEnd;
    deflate.packData = packData;
    deflate.push($.subarray(contentStart, fileEnd), true);

    return deflatedOffset;
};

var onDeflateData = function (chunk) {
    var packData = this.packData;
    if (packData.nextOffset + chunk.length > packData.capacity) {
        PackData.resize(packData, chunk.length);
    }
    var array = packData.array;
    var i;
    for (i = 0; i < chunk.length; i++) {
        array[packData.nextOffset + i] = chunk[i];
    }
    packData.nextOffset += i;
};

var onEnd = function (status) {
    if (status !== 0) throw new Error(this.strm.msg);
}

var chunks = [];

PackData.extractFile = function (packData, packOffset) {
    var pack_j = packOffset;
    var typeBits = packData.array[pack_j] & 0x70;
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

    var length = packData.array[pack_j] & 0xf;
    var shift = 4;
    while (packData.array[pack_j] & 0x80) {
        pack_j++;
        length |= (packData.array[pack_j] & 0x7f) << shift;
        shift += 7;
    }
    pack_j++;

    var lengthString = '' + length;
    var fileLength = prefix.length + lengthString.length + 1 + length;
    if ($Heap.nextOffset + fileLength > $Heap.capacity) {
        FileSystem.resizeHeap($FileSystem, fileLength);
    }
    var fileStart = $Heap.nextOffset;
    var fileEnd = fileStart + fileLength;
    $Heap.nextOffset = fileEnd;

    var file_j = fileStart;
    var i;
    for (i = 0; i < prefix.length; i++) {
        $[file_j + i] = prefix[i];
    }

    file_j += i;
    for (i = 0; i < lengthString.length; i++) {
        $[file_j + i] = lengthString.charCodeAt(i);
    }

    $Heap.nextOffset = file_j + i + 1;

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

    inflate.push(packData.array.subarray(pack_j), true);

    return [fileStart, fileEnd, pack_j + inflate.strm.next_in];
};

var onInflateData = function (chunk) {
    var i;
    for (i = 0; i < chunk.length; i++) {
        $[$Heap.nextOffset + i] = chunk[i];
    }
    $Heap.nextOffset += i;
};

})();
