'use strict';
global.BaseTreeObject = {};
(function () {

BaseTreeObject.set = function (thing, prop, value, offset, type) {
    if (type === 'object') {
        GitConvert.setHash(thing.file, offset, value.hash, value.hashOffset);
        thing[prop] = value;
    } else {
        if (type === 'string') {
            var blob = Value.blobFromString(value);
        } else if (type === 'number') {
            var blob = Value.blobFromNumber(value);
        } else if (type === 'boolean') {
            var blob = Value.blobFromBoolean(value);
        } else {
            throw new Error('Unsupported type: ' + type);
        }

        Sha1.hash(blob, thing.file, offset);
        var blobObject = Value.createBlobObject(value, blob, thing.file, offset);
        thing[prop] = Store.save(Global.store, blobObject).data;
    }
};

})();
