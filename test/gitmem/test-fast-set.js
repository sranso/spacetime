'use strict';
require('../helper');

global.$Heap = Heap.create(2048);
global.$ = $Heap.array;
var random = Random.create(29923321);
global.$HashTable = HashTable.create(16, $Heap, random);

FastSet.initialize();

var Thing = {};

var clone = function (original) {
    return {
        fileStart: -1,
        fileEnd: -1,
        hashOffset: -1,

        string: original.string,
        number: original.number,
        bool: original.bool,
        object: original.object,
    };
};

var types = {
    string: 'string',
    number: 'number',
    bool: 'boolean',
    object: 'object',
};

Thing.none = null;
var offsets = null;

Thing.initialize = function () {
    Thing.none = clone({
        string: '',
        number: 0,
        bool: false,
        object: null,
        fileStart: -1,
        fileEnd: -1,
        hashOffset: -1,
    });

    var noneTree = Tree.create({
        string: 'blob',
        number: 'blob',
        bool: 'blob',
        object: 'tree',
    });

    Thing.none.fileStart = noneTree[0];
    Thing.none.fileEnd = noneTree[1];
    offsets = noneTree[2];
};

Thing.set = function (original, prop, value) {
    return FastSet.set(original, prop, value, offsets, types, clone);
};

Thing.setAll = function (original, modifications) {
    return FastSet.setAll(original, modifications, offsets, types, clone);
};


Thing.initialize();



var objectRange = Value.blobFromString('bar');

var object1 = {
    fileStart: objectRange[0],
    fileEnd: objectRange[1],
    hashOffset: -1,

    bar: 'bar',
};

object1.hashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, object1.fileStart, object1.fileEnd, $, object1.hashOffset);

var thing1 = Thing.setAll(Thing.none, {
    string: 'foo',
    number: 375.2,
    bool: true,
    object: object1,
});

log(thing1.string, thing1.number, thing1.bool, thing1.object.bar);
//=> foo 375.2 true bar

log(hash($, thing1.fileStart + offsets.string));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82

var hashOffset = HashTable.findHashOffset($HashTable, thing1.fileStart + offsets.string);
log(hashOffset);
//=> 260
var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var gotString = $HashTable.objects[objectIndex].data;
log(gotString, typeof gotString);
//=> foo string

var thing2 = Thing.set(thing1, 'number', 42);
log(thing2.number);
//=> 42

var numberRange = Value.blobFromNumber(42);
var numberStart = numberRange[0];
var numberEnd = numberRange[1];
var numberHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, numberStart, numberEnd, $, numberHashOffset);
hashOffset = HashTable.findHashOffset($HashTable, numberHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var gotNumber = $HashTable.objects[objectIndex].data;
log(gotNumber, typeof gotNumber);
//=> 42 'number'

hashOffset = HashTable.findHashOffset($HashTable, thing2.fileStart + offsets.bool);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var gotBool = $HashTable.objects[objectIndex].data;
log(gotBool, typeof gotBool);
//=> true 'boolean'
