'use strict';
require('../helper');

var random = Random.create(29923321);
var table = HashTable.create(random);
global.$HashTable = table;

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
    var thing = Thing.clone(original);
    BaseTreeObject.set(thing, prop, value, Thing.offsets[prop], Thing.types[prop]);
    thing.hash = new Uint8Array(20);
    Sha1.hash(thing.file, thing.hash, 0);

    return HashTable.save($HashTable, thing);
};

Thing.setAll = function (original, modifications) {
    var thing = Thing.clone(original);

    for (var prop in modifications) {
        var value = modifications[prop];
        BaseTreeObject.set(thing, prop, value, Thing.offsets[prop], Thing.types[prop]);
    }
    thing.hash = new Uint8Array(20);
    Sha1.hash(thing.file, thing.hash, 0);

    return HashTable.save($HashTable, thing);
};

var object1 = {
    bar: 'bar',
    file: Value.blobFromString('bar'),
    hash: new Uint8Array(20),
    hashOffset: 0,
};
Sha1.hash(object1.file, object1.hash, 0);
HashTable.save(table, object1);

var thing1 = Thing.setAll(Thing.none, {
    string: 'foo',
    number: 375.2,
    bool: true,
    object: object1,
});

log(thing1.string, thing1.number, thing1.bool, thing1.object.bar);
//=> foo 375.2 true bar

log(GitConvert.hashToString(thing1.file, Thing.offsets.string));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82

var gotString = HashTable.get(table, thing1.file, Thing.offsets.string).data;
log(gotString, typeof gotString);
//=> foo string

var thing2 = Thing.set(thing1, 'number', 42);
log(thing2.number);
//=> 42

var numberBlob = Value.blobFromNumber(42);
var numberHash = new Uint8Array(20);
Sha1.hash(numberBlob, numberHash, 0);
var gotNumber = HashTable.get(table, numberHash, 0).data;
log(gotNumber, typeof gotNumber);
//=> 42 'number'

var gotBool = HashTable.get(table, thing1.file, Thing.offsets.bool).data;
log(gotBool, typeof gotBool);
//=> true 'boolean'

var gotObject = HashTable.get(table, thing1.file, Thing.offsets.object);
log(gotObject.bar);
//=> bar
