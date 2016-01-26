'use strict';
global.Blob = {};
(function () {

var blobPrefix = GitFile.stringToArray('blob ');

Blob.catFile = function (file) {
    var type = String.fromCharCode.apply(null, file.subarray(0, file.indexOf(0x20)));

    if (type !== 'blob') {
        throw new Error('Unexpected type: ' + type);
    }
    return String.fromCharCode.apply(null, file.subarray(file.indexOf(0) + 1));
};

Blob.fromString = function (string) {
    var lengthString = '' + string.length;
    var blob = new Uint8Array(6 + lengthString.length + string.length);

    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        blob[i] = blobPrefix[i];
    }

    var j = i;
    for (i = 0; i < lengthString.length; i++) {
        blob[j + i] = lengthString.charCodeAt(i);
    }

    j += i + 1;
    for (i = 0; i < string.length; i++) {
        blob[j + i] = string.charCodeAt(i);
    }
    return blob;
};

Blob.empty = Blob.fromString('');
Blob.emptyHash = new Uint8Array(20);
Sha1.hash(Blob.empty, Blob.emptyHash, 0);

})();
