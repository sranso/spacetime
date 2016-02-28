'use strict';
global.Blob = {};
(function () {

Blob.emptyStart = -1;
Blob.emptyEnd = -1;
Blob.emptyHashOffset = -1;

Blob.initialize = function () {
    var emptyBlobRange = Blob.createFromString('');
    Blob.emptyStart = emptyBlobRange[0];
    Blob.emptyEnd = emptyBlobRange[1];
    Blob.emptyHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
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
    $Heap.nextOffset += blobLength;

    var blobj = blobStart;
    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        $[blobj + i] = blobPrefix[i];
    }

    blobj += i;
    for (i = 0; i < lengthString.length; i++) {
        $[blobj + i] = lengthString.charCodeAt(i);
    }
    $[blobj + i] = 0;

    blobj += i + 1;
    for (i = 0; i < string.length; i++) {
        $[blobj + i] = string.charCodeAt(i);
    }

    return [blobStart, blobStart + blobLength];
};

Blob.contentStart = function (blobStart) {
    return $.indexOf(0, blobStart + 6) + 1;
};

})();
