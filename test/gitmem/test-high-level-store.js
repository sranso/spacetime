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

Thing.set = function (original, prop, value) {
    return HighLevelStore.set(Thing, original, prop, value);
};

Thing.setAll = function (original, modifications) {
    return HighLevelStore.setAll(Thing, original, modifications);
};

var object1 = {
    bar: 'bar',
    file: Value.blobFromString('bar'),
    hash: new Uint8Array(20),
    hashOffset: 0,
};

var thing1 = Thing.setAll(Thing.none, {
    string: 'foo',
    number: 375.2,
    bool: true,
    object: object1,
});

log(thing1.string, thing1.number, thing1.bool, thing1.object.bar);
//=> foo 375.2 true bar

log(GitFile.hashToString(thing1.file, Thing.offsets.string));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c

var gotString = Store.get(store, thing1.file, Thing.offsets.string).data;
log(gotString);
//=> foo

var thing2 = Thing.set(thing1, 'number', 42);
log(thing2.number);
//=> 42

var numberBlob = Value.blobFromNumber(42);
var numberHash = new Uint8Array(20);
Sha1.hash(numberBlob, numberHash, 0);
var gotNumber = Store.get(store, numberHash, 0).data;
log(gotNumber);
//=> 42
