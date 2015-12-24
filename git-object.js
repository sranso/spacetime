'use strict';
var GitObject = {};
module.exports = GitObject;
(function () {

var stringToArray = function (string) {
    var array = new Uint8Array(string.length);
    for (var i = 0; i < string.length; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array;
};

var blobPrefix = stringToArray('blob ');

GitObject.stringToBlob = function (string) {
    var lengthString = '' + string.length;
    var blob = new Uint8Array(6 + lengthString.length + string.length);

    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        blob[i] = blobPrefix[i];
    }

    for (i = 0; i < lengthString.length; i++) {
        blob[i + 5] = lengthString.charCodeAt(i);
    }

    var offset = 6 + lengthString.length;
    for (i = 0; i < string.length; i++) {
        blob[i + offset] = string.charCodeAt(i);
    }
    return blob;
};

})();
