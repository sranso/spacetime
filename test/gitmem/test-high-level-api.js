var helper = require('../helper');

Random.seed(1);
var store = Store.create();
Global.store = store;

var Thing = {};
Thing.clone = function (original) {
    return {
        string: original.string,
        number: original.number,
        bool: original.bool,
        object: original.object,
        file: original.file.slice(),
        hash: null,
        hashOffset: 0,
    };
};

Thing.none = Thing.clone({
    string: '',
    number: 0,
    bool: false,
    object: null,
    file: new Uint8Array(0),
    hash: new Uint8Array(20),
    hashOffset: 0,
});

Thing.offsets = {};
Thing.none.file = Tree.createSkeleton(Thing.offsets, {
    string: 'blob',
    number: 'blob',
    bool: 'blob',
    object: 'tree',
});

Thing.types = {
    string: 'string',
    number: 'number',
    bool: 'boolean',
    object: 'object',
};

Thing.set = function (original, prop, value) {
    return HighLevelApi.set(Thing, original, prop, value);
};

Thing.setAll = function (original, modifications) {
    return HighLevelApi.setAll(Thing, original, modifications);
};

var object1 = {
    bar: 'bar',
    file: Value.blobFromString('bar'),
    hash: new Uint8Array(20),
    hashOffset: 0,
};
Sha1.hash(object1.file, object1.hash, 0);
Store.save(store, object1);

var thing1 = Thing.setAll(Thing.none, {
    string: 'foo',
    number: 375.2,
    bool: true,
    object: object1,
});

log(thing1.string, thing1.number, thing1.bool, thing1.object.bar);
//=> foo 375.2 true bar

log(GitFile.hashToString(thing1.file, Thing.offsets.string));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82

var gotString = Store.get(store, thing1.file, Thing.offsets.string).data;
log(gotString, typeof gotString);
//=> foo string

var thing2 = Thing.set(thing1, 'number', 42);
log(thing2.number);
//=> 42

var numberBlob = Value.blobFromNumber(42);
var numberHash = new Uint8Array(20);
Sha1.hash(numberBlob, numberHash, 0);
var gotNumber = Store.get(store, numberHash, 0).data;
log(gotNumber, typeof gotNumber);
//=> 42 'number'

var gotBool = Store.get(store, thing1.file, Thing.offsets.bool).data;
log(gotBool, typeof gotBool);
//=> true 'boolean'

var gotObject = Store.get(store, thing1.file, Thing.offsets.object);
log(gotObject.bar);
//=> bar
