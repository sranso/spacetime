'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
global.$ = $Heap.array;
var random = Random.create(29923321);
global.$HashTable = HashTable.create(16, random);
global.$Objects = Objects.create(16);

Tree.initialize();
FastSet.initialize();

var Thing = {};

var clone = function (original) {
    return {
        flags: 0,
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
    var noneValues = {
        string: '',
        number: 0,
        bool: false,
        object: {hashOffset: Tree.emptyHashOffset},
    };

    var none = clone(noneValues);

    var noneTree = Tree.create({
        string: 'blob',
        number: 'blob',
        bool: 'blob',
        object: 'tree',
    });

    none.fileStart = noneTree[0];
    none.fileEnd = noneTree[1];
    offsets = noneTree[2];

    $Heap.nextOffset = none.fileStart;

    Thing.none = Thing.setAll(none, noneValues);
};

Thing.set = function (original, prop, value) {
    return FastSet.set(original, prop, value, offsets, types, clone);
};

Thing.setAll = function (original, modifications) {
    return FastSet.setAll(original, modifications, offsets, types, clone);
};


Thing.initialize();

var none = Thing.none;
log('"' + none.string + '"', none.number, none.bool);
//=> "" 0 false

log(none.fileStart, none.fileEnd, none.fileEnd - none.fileStart);
//=> 148 290 142

log(hash($, none.fileStart + offsets.bool));
//=> 02e4a84d62c4b0fe9cca60bba7b9799f78f1f7ed

var hashOffset = HashTable.findHashOffset($HashTable, $, none.fileStart + offsets.bool);
var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var gotBool = $Objects.table[objectIndex].value;
log(gotBool, typeof gotBool);
//=> false 'boolean'


var objectRange = Value.createBlob('bar', 'string');

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

log(thing1.flags & Objects.isFullObject);
//=> 1

var searchHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, thing1.fileStart, thing1.fileEnd, $, searchHashOffset);
hashOffset = HashTable.findHashOffset($HashTable, $, searchHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
log($Objects.table[objectIndex] === thing1);
//=> true

log(hash($, thing1.fileStart + offsets.string));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82

hashOffset = HashTable.findHashOffset($HashTable, $, thing1.fileStart + offsets.string);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var gotString = $Objects.table[objectIndex].value;
log(gotString, typeof gotString);
//=> foo string

var thing2 = Thing.set(thing1, 'number', 42);
log(thing2.number);
//=> 42
log(thing2.flags & Objects.isFullObject);
//=> 1

var thing3 = Thing.set(thing2, 'number', 375.2);
log(thing3.number);
//=> 375.2
log(thing3 === thing1);
//=> true

var numberRange = Value.createBlob(42, 'number');
var numberStart = numberRange[0];
var numberEnd = numberRange[1];
var numberHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, numberStart, numberEnd, $, numberHashOffset);
hashOffset = HashTable.findHashOffset($HashTable, $, numberHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var gotNumber = $Objects.table[objectIndex].value;
log(gotNumber, typeof gotNumber);
//=> 42 'number'

hashOffset = HashTable.findHashOffset($HashTable, $, thing2.fileStart + offsets.bool);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var gotBool = $Objects.table[objectIndex].value;
log(gotBool, typeof gotBool);
//=> true 'boolean'
