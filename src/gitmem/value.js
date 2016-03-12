'use strict';
global.Value = {};
(function () {

Value.createObject = function (value) {
    return {
        fileStart: -1,
        fileEnd: -1,
        hashOffset: -1,

        value: value,
    };
};

Value.createBlob = function (type, value) {
    if (type === 'string') {
        return Blob.createFromString('"' + value);
    } else if (type === 'number') {
        return Blob.createFromString('' + Number(value));
    } else if (type === 'boolean') {
        return Blob.createFromString('' + Boolean(value));
    } else {
        throw new Error('Unsupported type: ' + type);
    }
};

var checkoutString = function (fileStart, fileEnd) {
    var contentStart = Blob.contentStart(fileStart);
    var fileArray = $.subarray(contentStart + 1, fileEnd);
    var string = String.fromCharCode.apply(null, fileArray);
    return Value.createObject(string);
};

var checkoutNumber = function (fileStart, fileEnd) {
    var contentStart = Blob.contentStart(fileStart);
    var fileArray = $.subarray(contentStart, fileEnd);
    var number = Number(String.fromCharCode.apply(null, fileArray));
    return Value.createObject(number);
};

var checkoutBoolean = function (fileStart, fileEnd) {
    var contentStart = Blob.contentStart(fileStart);
    var bool = $[contentStart] === 't'.charCodeAt(0);
    return Value.createObject(bool);
};

Value.checkout = function (type, searchHashOffset) {
    if (type === 'string') {
        return FastCheckout.checkout(searchHashOffset, checkoutString).value;
    } else if (type === 'number') {
        return FastCheckout.checkout(searchHashOffset, checkoutNumber).value;
    } else if (type === 'boolean') {
        return FastCheckout.checkout(searchHashOffset, checkoutBoolean).value;
    } else {
        throw new Error('Unsupported type: ' + type);
    }
};

})();
