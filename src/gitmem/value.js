'use strict';
global.Value = {};
(function () {

Value.createObject = function (value) {
    return {
        flags: 0,
        fileStart: -1,
        fileEnd: -1,
        hashOffset: -1,

        value: value,
    };
};

Value.createBlob = function (value, type, blobRange) {
    if (type === 'string') {
        return Blob.create('"' + value, blobRange);
    } else if (type === 'number') {
        return Blob.create('' + Number(value), blobRange);
    } else if (type === 'boolean') {
        return Blob.create('' + Boolean(value), blobRange);
    } else {
        throw new Error('Unsupported type: ' + type);
    }
};

var checkoutString = function ($f, fileStart, fileEnd) {
    var contentStart = Blob.contentStart($f, fileStart);
    var fileArray = $f.subarray(contentStart + 1, fileEnd);
    var string = String.fromCharCode.apply(null, fileArray);
    return Value.createObject(string);
};

var checkoutNumber = function ($f, fileStart, fileEnd) {
    var contentStart = Blob.contentStart($f, fileStart);
    var fileArray = $f.subarray(contentStart, fileEnd);
    var number = Number(String.fromCharCode.apply(null, fileArray));
    return Value.createObject(number);
};

var checkoutBoolean = function ($f, fileStart, fileEnd) {
    var contentStart = Blob.contentStart($f, fileStart);
    var bool = $f[contentStart] === 't'.charCodeAt(0);
    return Value.createObject(bool);
};

Value.checkout = function ($s, searchHashOffset, type) {
    if (type === 'string') {
        return FastCheckout.checkout($s, searchHashOffset, checkoutString).value;
    } else if (type === 'number') {
        return FastCheckout.checkout($s, searchHashOffset, checkoutNumber).value;
    } else if (type === 'boolean') {
        return FastCheckout.checkout($s, searchHashOffset, checkoutBoolean).value;
    } else {
        throw new Error('Unsupported type: ' + type);
    }
};

})();
