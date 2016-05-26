'use strict';
global.Blob = {};
(function () {

var blobPrefix = Convert.stringToArray('blob ');

Blob.create = function (file, string) {
    var lengthString = '' + string.length;
    var blobLength = blobPrefix.length + lengthString.length + 1 + string.length;

    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        file[i] = blobPrefix[i];
    }

    var blob_j = i;
    for (i = 0; i < lengthString.length; i++) {
        file[blob_j + i] = lengthString.charCodeAt(i);
    }
    file[blob_j + i] = 0;

    blob_j += i + 1;
    for (i = 0; i < string.length; i++) {
        file[blob_j + i] = string.charCodeAt(i);
    }

    return blobLength;
};

})();
