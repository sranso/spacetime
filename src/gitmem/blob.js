'use strict';
global.Blob = {};
(function () {

Blob.emptyStart = -1;
Blob.emptyEnd = -1;
Blob.emptyHashOffset = -1;

Blob.initialize = function () {
    $Heap.nextOffset = 64 * Math.ceil($Heap.nextOffset / 64);
    Blob.emptyHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
    var emptyBlobRange = Blob.createFromString('');
    Blob.emptyStart = emptyBlobRange[0];
    Blob.emptyEnd = emptyBlobRange[1];
    Sha1.hash($, Blob.emptyStart, Blob.emptyEnd, Blob.emptyHashOffset);
};

var blobPrefix = GitConvert.stringToArray('blob ');

Blob.createFromString = function (string) {
    var lengthString = '' + string.length;
    var blobLength = blobPrefix.length + lengthString.length + 1 + string.length;
    if ($Heap.nextOffset + blobLength > $Heap.capacity) {
        FileSystem.resizeHeap($FileSystem, blobLength);
    }
    var blobStart = $Heap.nextOffset;
    var blobEnd = blobStart + blobLength;
    $Heap.nextOffset = blobEnd;

    var blob_j = blobStart;
    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        $[blob_j + i] = blobPrefix[i];
    }

    blob_j += i;
    for (i = 0; i < lengthString.length; i++) {
        $[blob_j + i] = lengthString.charCodeAt(i);
    }
    $[blob_j + i] = 0;

    blob_j += i + 1;
    for (i = 0; i < string.length; i++) {
        $[blob_j + i] = string.charCodeAt(i);
    }

    return [blobStart, blobEnd];
};

Blob.contentStart = function (blobStart) {
    return $.indexOf(0, blobStart + 6) + 1;
};

})();
