'use strict';
global.Blob = {};
(function () {

Blob.emptyBegin = -1;
Blob.emptyEnd = -1;
Blob.emptyHashOffset = -1;

Blob.initialize = function () {
    var emptyBlobRange = Blob.createFromString('');
    Blob.emptyBegin = emptyBlobRange[0];
    Blob.emptyEnd = emptyBlobRange[1];
    Blob.emptyHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
    Sha1.hash($, Blob.emptyBegin, Blob.emptyEnd, Blob.emptyHashOffset);
};

var blobPrefix = GitConvert.stringToArray('blob ');

Blob.createFromString = function (string) {
    var lengthString = '' + string.length;
    var blobLength = blobPrefix.length + lengthString.length + 1 + string.length;
    if ($Heap.nextOffset + blobLength > $Heap.capacity) {
        FileSystem.resizeHeap($FileSystem, blobLength);
    }
    var blobBegin = $Heap.nextOffset;
    $Heap.nextOffset += blobLength;

    var blobj = blobBegin;
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

    return [blobBegin, blobBegin + blobLength];
};

Blob.contentBegin = function (blobBegin) {
    return $.indexOf(0, blobBegin + 6) + 1;
};

})();
