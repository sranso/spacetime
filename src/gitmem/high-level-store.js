'use strict';
global.HighLevelStore = {};
(function () {

var set = function (Thing, thing, prop, value) {
    var type = Thing.types[prop];

    if (type === 'object') {
        GitFile.setHash(thing.file, Thing.offsets[prop], value.hash, value.hashOffset);
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
        var hashOffset = Thing.offsets[prop];
        Sha1.hash(blob, thing.file, hashOffset);
        var blobObject = Value.createBlobObject(value, blob, thing.file, hashOffset);
        thing[prop] = Store.save(Global.store, blobObject).data;
    }
};

HighLevelStore.set = function (Thing, original, prop, value) {
    var thing = Thing.clone(original);

    set(Thing, thing, prop, value);

    thing.hash = new Uint8Array(20);
    thing.hashOffset = 0;
    Sha1.hash(thing.file, thing.hash, thing.hashOffset);

    return Store.save(Global.store, thing);
};

HighLevelStore.setAll = function (Thing, original, modifications) {
    var thing = Thing.clone(original);

    for (var prop in modifications) {
        var value = modifications[prop];
        set(Thing, thing, prop, value);
    }

    thing.hash = new Uint8Array(20);
    thing.hashOffset = 0;
    Sha1.hash(thing.file, thing.hash, thing.hashOffset);

    return Store.save(Global.store, thing);
};

})();
