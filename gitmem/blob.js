'use strict';
global.Blob = {};
(function () {

var blobPrefix = Convert.stringToArray('blob ');

Blob.create = function (string, blobRange) {
    var lengthString = '' + string.length;
    var blobLength = blobPrefix.length + lengthString.length + 1 + string.length;

    FileCache.malloc($fileCache, blobLength);
    var blobStart = $fileCache.nextArrayOffset;
    var blobEnd = blobStart + blobLength;
    $fileCache.nextArrayOffset = blobEnd;

    var $f = $fileCache.array;

    var blob_j = blobStart;
    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        $f[blob_j + i] = blobPrefix[i];
    }

    blob_j += i;
    for (i = 0; i < lengthString.length; i++) {
        $f[blob_j + i] = lengthString.charCodeAt(i);
    }
    $f[blob_j + i] = 0;

    blob_j += i + 1;
    for (i = 0; i < string.length; i++) {
        $f[blob_j + i] = string.charCodeAt(i);
    }

    blobRange[0] = blobStart;
    blobRange[1] = blobEnd;
    return blobRange;
};

Blob.contentStart = function ($b, blobStart) {
    return $b.indexOf(0, blobStart + 6) + 1;
};

})();
