'use strict';
var HighLevelApi = {};
module.exports = HighLevelApi;
var GitFile = require('./git-file');
var Store = require('./store');
var Sha1 = require('./sha1');
(function () {

HighLevelApi.setup = function (Thing) {
    Thing.set = function (original, prop, value) {
        var thing = Thing.clone(original);

        if (value.file) {
            GitFile.setHash(thing.file, Thing.offsets[prop], value.hash, value.hashOffset);
            thing[prop] = value;
        } else {
            var blob = GitFile.blobFromString('' + value);
            var hashOffset = Thing.offsets[prop];
            Sha1.hash(blob, thing.file, hashOffset);
            var blobObject = Store.createBlobObject(value, blob, thing.file, hashOffset);
            thing[prop] = Store.save(blobObject).data;
        }

        thing.hash = new Uint8Array(20);
        thing.hashOffset = 0;
        Sha1.hash(thing.file, thing.hash, thing.hashOffset);
        return Store.save(thing);
    };

    Thing.setAll = function (original, modifications) {
        var thing = Thing.clone(original);

        for (var prop in modifications) {
            var value = modifications[prop];
            if (value.file) {
                GitFile.setHash(thing.file, Thing.offsets[prop], value.hash, value.hashOffset);
                thing[prop] = value;
            } else {
                var blob = GitFile.blobFromString('' + value);
                var hashOffset = Thing.offsets[prop];
                Sha1.hash(blob, thing.file, hashOffset);
                var blobObject = Store.createBlobObject(value, blob, thing.file, hashOffset);
                thing[prop] = Store.save(blobObject).data;
            }
        }

        thing.hash = new Uint8Array(20);
        thing.hashOffset = 0;
        Sha1.hash(thing.file, thing.hash, thing.hashOffset);
        return Store.save(thing);
    };
};

})();
