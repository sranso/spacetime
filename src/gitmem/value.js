'use strict';
global.Value = {};
(function () {

Value.createBlobObject = function (fileStart, fileEnd, hashOffset, data) {
    return {
        fileStart: fileStart,
        fileEnd: fileEnd,
        hashOffset: hashOffset,

        data: data,
    };
};

Value.none = {
    data: null,
    file: Tree.emptyTree,
    hash: Tree.emptyTreeHash,
    hashOffset: 0,
};

Value.blobFromString = function (string) {
    return Blob.createFromString('"' + string);
};

Value.blobFromNumber = function (number) {
    return Blob.createFromString('' + Number(number));
};

Value.blobFromBoolean = function (bool) {
    return Blob.createFromString('' + Boolean(bool));
};

Value.parseString = function (blobStart, blobEnd) {
    var contentStart = Blob.contentStart(blobStart);
    var blobArray = $.subarray(contentStart + 1, blobEnd);
    return String.fromCharCode.apply(null, blobArray);
};

Value.parseNumber = function (blobStart, blobEnd) {
    var contentStart = Blob.contentStart(blobStart);
    var blobArray = $.subarray(contentStart, blobEnd);
    return Number(String.fromCharCode.apply(null, blobArray));
};

Value.parseBoolean = function (blobStart, blobEnd) {
    var contentStart = Blob.contentStart(blobStart);
    return $[contentStart] === 't'.charCodeAt(0);
};

Value.checkoutString = function (searchHashOffset) {
    var hashOffset = HashTable.findHashOffset($HashTable, searchHashOffset);
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
    if ($[flagsOffset] & HashTable.isObject) {
        return $HashTable.objects[objectIndex].data;
    }

    var packOffset = $PackIndex.offsets[objectIndex];
    var fileRange = PackData.extractFile($PackData, $PackData.array, packOffset);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    var string = Value.parseString(fileStart, fileEnd);
    var object = Value.createBlobObject(fileStart, fileEnd, hashOffset, string);
    $HashTable.objects[objectIndex] = object;
    $[flagsOffset] |= HashTable.isObject;

    return string;
};

Value.checkoutNumber = function (searchHashOffset) {
    var hashOffset = HashTable.findHashOffset($HashTable, searchHashOffset);
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
    if ($[flagsOffset] & HashTable.isObject) {
        return $HashTable.objects[objectIndex].data;
    }

    var packOffset = $PackIndex.offsets[objectIndex];
    var fileRange = PackData.extractFile($PackData, $PackData.array, packOffset);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    var number = Value.parseNumber(fileStart, fileEnd);
    var object = Value.createBlobObject(fileStart, fileEnd, hashOffset, number);
    $HashTable.objects[objectIndex] = object;
    $[flagsOffset] |= HashTable.isObject;

    return number;
};

Value.checkoutBoolean = function (searchHashOffset) {
    var hashOffset = HashTable.findHashOffset($HashTable, searchHashOffset);
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
    if ($[flagsOffset] & HashTable.isObject) {
        return $HashTable.objects[objectIndex].data;
    }

    var packOffset = $PackIndex.offsets[objectIndex];
    var fileRange = PackData.extractFile($PackData, $PackData.array, packOffset);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    var bool = Value.parseBoolean(fileStart, fileEnd);
    var object = Value.createBlobObject(fileStart, fileEnd, hashOffset, bool);
    $HashTable.objects[objectIndex] = object;
    $[flagsOffset] |= HashTable.isObject;

    return bool;
};

})();
