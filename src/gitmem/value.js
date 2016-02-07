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

Value.blobFromString = Blob.createFromString;

Value.blobFromNumber = function (number) {
    return Blob.createFromString('' + Number(number));
};

Value.blobFromBoolean = function (bool) {
    return Blob.createFromString('' + Boolean(bool));
};

Value.parseString = Blob.parseString;

Value.parseNumber = function (blob) {
    return Number(Blob.parseString(blob));
};

Value.parseBoolean = function (blob) {
    return Boolean(Blob.parseString(blob));
};

Value.checkoutString = function (packIndices, store, hash, hashOffset) {
    var string = Store.get(store, hash, hashOffset);
    if (string != null) {
        return string;
    }

    var file = PackIndex.requireFileMultiple(packIndices, hash, hashOffset);
    string = Value.parseString(file);
    Store.save(store, Value.createBlobObject(string, file, hash, hashOffset));
    return string;
};

Value.checkoutNumber = function (packIndices, store, hash, hashOffset) {
    var number = Store.get(store, hash, hashOffset);
    if (number != null) {
        return number;
    }

    var file = PackIndex.requireFileMultiple(packIndices, hash, hashOffset);
    number = Value.parseNumber(file);
    Store.save(store, Value.createBlobObject(number, file, hash, hashOffset));
    return number;
};

Value.checkoutBoolean = function (packIndices, store, hash, hashOffset) {
    var bool = Store.get(store, hash, hashOffset);
    if (bool != null) {
        return bool;
    }

    var file = PackIndex.requireFileMultiple(packIndices, hash, hashOffset);
    bool = Value.parseBoolean(file);
    Store.save(store, Value.createBlobObject(bool, file, hash, hashOffset));
    return bool;
};

})();
