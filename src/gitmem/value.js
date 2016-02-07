'use strict';
global.Value = {};
(function () {

Value.blobFromString = Blob.createFromString;

Value.blobFromNumber = function (number) {
    return Blob.createFromString('' + Number(number));
};

Value.blobFromBoolean = function (bool) {
    return Blob.createFromString('' + Boolean(bool));
};

Value.getString = Blob.getString;

Value.getNumber = function (blob) {
    return Number(Blob.getString(blob));
};

Value.getBoolean = function (blob) {
    return Boolean(Blob.getString(blob));
};

})();
