'use strict';
global.Value = {};
(function () {

Value.createBlobObject = function (data, file, hash, hashOffset) {
    return {
        data: data,
        file: file,
        hash: hash,
        hashOffset: hashOffset,
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

Value.parseString = function (blob) {
    return Blob.parseStringOffset(blob, 1);
};

Value.parseNumber = function (blob) {
    return Number(Blob.parseString(blob));
};

Value.parseBoolean = function (blob) {
    return Blob.parseArray(blob)[0] === 't'.charCodeAt(0);
};

Value.checkoutString = function (packIndices, table, hash, hashOffset) {
    var string = HashTable.get(table, hash, hashOffset);
    if (string != null) {
        return string.data;
    }

    var file = PackIndex.lookupFileMultiple(packIndices, hash, hashOffset);
    string = Value.parseString(file);
    HashTable.save(table, Value.createBlobObject(string, file, hash, hashOffset));
    return string;
};

Value.checkoutNumber = function (packIndices, table, hash, hashOffset) {
    var number = HashTable.get(table, hash, hashOffset);
    if (number != null) {
        return number.data;
    }

    var file = PackIndex.lookupFileMultiple(packIndices, hash, hashOffset);
    number = Value.parseNumber(file);
    HashTable.save(table, Value.createBlobObject(number, file, hash, hashOffset));
    return number;
};

Value.checkoutBoolean = function (packIndices, table, hash, hashOffset) {
    var bool = HashTable.get(table, hash, hashOffset);
    if (bool != null) {
        return bool.data;
    }

    var file = PackIndex.lookupFileMultiple(packIndices, hash, hashOffset);
    bool = Value.parseBoolean(file);
    HashTable.save(table, Value.createBlobObject(bool, file, hash, hashOffset));
    return bool;
};

})();
