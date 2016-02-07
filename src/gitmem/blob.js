'use strict';
global.Blob = {};
(function () {

var blobPrefix = GitFile.stringToArray('blob ');

Blob.catFile = function (file) {
    var type = String.fromCharCode.apply(null, file.subarray(0, file.indexOf(0x20, 4)));

    if (type !== 'blob') {
        throw new Error('Unexpected type: ' + type);
    }
    return Blob.parseString(file);
};

Blob.createFromString = function (string) {
    var lengthString = '' + string.length;
    var blob = new Uint8Array(blobPrefix.length + lengthString.length + 1 + string.length);

    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        blob[i] = blobPrefix[i];
    }

    var j = i;
    for (i = 0; i < lengthString.length; i++) {
        blob[j + i] = lengthString.charCodeAt(i);
    }
    blob[j + i] = 0;

    j += i + 1;
    for (i = 0; i < string.length; i++) {
        blob[j + i] = string.charCodeAt(i);
    }
    return blob;
};

Blob.createFromArray = function (array) {
    var lengthString = '' + array.length;
    var blob = new Uint8Array(blobPrefix.length + lengthString.length + 1 + array.length);

    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        blob[i] = blobPrefix[i];
    }

    var j = i;
    for (i = 0; i < lengthString.length; i++) {
        blob[j + i] = lengthString.charCodeAt(i);
    }

    j += i + 1;
    for (i = 0; i < array.length; i++) {
        blob[j + i] = array[i];
    }
    return blob;
};

Blob.parseArray = function (blob) {
    return blob.subarray(blob.indexOf(0, 6) + 1);
};

Blob.parseString = function (blob) {
    return String.fromCharCode.apply(null, blob.subarray(blob.indexOf(0, 6) + 1));
};

Blob.parseStringOffset = function (blob, offset) {
    return String.fromCharCode.apply(null, blob.subarray(blob.indexOf(0, 6) + 1 + offset));
};

Blob.emptyBlob = Blob.createFromString('');
Blob.emptyBlobHash = new Uint8Array(20);
Sha1.hash(Blob.emptyBlob, Blob.emptyBlobHash, 0);

})();
