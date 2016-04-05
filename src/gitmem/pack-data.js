'use strict';
global.PackData = {};
(function () {

var blobPrefix = Convert.stringToArray('blob ');
var treePrefix = Convert.stringToArray('tree ');
var commitPrefix = Convert.stringToArray('commit ');

PackData.create = function (capacity) {
    return {
        array: new Uint8Array(capacity),
        nextOffset: 0,
    };
};

var maxPackHeaderSize = 8;

PackData.resize = function (packData, mallocSize) {
    var capacity = packData.array.length;
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
};

PackData.packFile = function (packData, $f, fileStart, fileEnd) {
    var contentStart = $f.indexOf(0, fileStart + 5) + 1;
    var length = fileEnd - contentStart;

    if (length < 32768) {
        // Try to only need one chunk.
        var chunkSize = 4096 * ((length >>> 13) + 1);
    } else {
        // Shoot for 1/4 of the inflated size to reduce overhead.
        var chunkSize = 8192 * (((length / 4) >>> 13) + 1);
    }

    var typeBits;
    if ($f[fileStart] === blobPrefix[0]) {
        typeBits = 0x30;
    } else if ($f[fileStart + 1] === treePrefix[1]) {
        typeBits = 0x20;
    } else if ($f[fileStart] === commitPrefix[0]) {
        typeBits = 0x10;
    } else {
        throw new Error('Unknown type: ' + $f.slice(fileStart, fileStart + 4).join(','));
    }

    if (packData.nextOffset + maxPackHeaderSize > packData.array.length) {
        PackData.resize(packData, maxPackHeaderSize);
    }
    var deflatedOffset = packData.nextOffset;
    var c = typeBits | (length & 0xf);

    length >>>= 4;
    while (length) {
        packData.array[packData.nextOffset] = c | 0x80;
        c = length & 0x7f;
        length >>>= 7;
        packData.nextOffset++;
    }
    packData.array[packData.nextOffset] = c;
    packData.nextOffset++;

    var deflate = new pako.Deflate({level: 6, chunkSize: chunkSize});
    deflate.onData = onDeflateData;
    deflate.onEnd = onEnd;
    deflate.packData = packData;
    deflate.push($f.subarray(contentStart, fileEnd), true);

    return deflatedOffset;
};

var onDeflateData = function (chunk) {
    var packData = this.packData;
    if (packData.nextOffset + chunk.length > packData.array.length) {
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

PackData.extractFile = function (packDataArray, packOffset, fileRange) {
    var pack_j = packOffset;
    var typeBits = packDataArray[pack_j] & 0x70;
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

    var length = packDataArray[pack_j] & 0xf;
    var shift = 4;
    while (packDataArray[pack_j] & 0x80) {
        pack_j++;
        length |= (packDataArray[pack_j] & 0x7f) << shift;
        shift += 7;
    }
    pack_j++;

    var lengthString = '' + length;
    var fileLength = prefix.length + lengthString.length + 1 + length;

    FileCache.malloc($FileCache, fileLength);
    var fileStart = $FileCache.nextArrayOffset;
    var fileEnd = fileStart + fileLength;

    var i;
    for (i = 0; i < prefix.length; i++) {
        $FileCache.array[$FileCache.nextArrayOffset + i] = prefix[i];
    }

    $FileCache.nextArrayOffset += i;
    for (i = 0; i < lengthString.length; i++) {
        $FileCache.array[$FileCache.nextArrayOffset + i] = lengthString.charCodeAt(i);
    }

    $FileCache.nextArrayOffset += i + 1;

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

    inflate.push(packDataArray.subarray(pack_j), true);

    var nextPackOffset = pack_j + inflate.strm.next_in;

    fileRange[0] = fileStart;
    fileRange[1] = fileEnd;
    return nextPackOffset;
};

var onInflateData = function (chunk) {
    var i;
    for (i = 0; i < chunk.length; i++) {
        $FileCache.array[$FileCache.nextArrayOffset + i] = chunk[i];
    }
    $FileCache.nextArrayOffset += i;
};

})();
