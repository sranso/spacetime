'use strict';
require('../../test/helper');

global.$heap = Heap.create(1024);
var $h = $heap.array;
var random = Random.create(29923321);
global.$hashTable = HashTable.create(16, random);
global.$fileCache = FileCache.create(8, 128);

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
var offsets = {};

var hashOffset = $heap.nextOffset;
$heap.nextOffset += 20;

Thing.initialize = function () {
    var noneValues = {
        string: '',
        number: 0,
        bool: false,
        object: {hashOffset: hashOffset},
    };

    var none = clone(noneValues);

    var fileRange = Tree.create({
        string: 'blob',
        number: 'blob',
        bool: 'blob',
        object: 'tree',
    }, offsets, []);

    none.fileStart = fileRange[0];
    none.fileEnd = fileRange[1];

    $heap.nextOffset = none.fileStart;

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
//=> 49 191 142

log(hash($h, none.fileStart + offsets.bool));
//=> 02e4a84d62c4b0fe9cca60bba7b9799f78f1f7ed

hashOffset = HashTable.findHashOffset($hashTable, $h, none.fileStart + offsets.bool);
var objectIndex = HashTable.objectIndex(hashOffset);
var gotBool = $hashTable.objects[objectIndex].value;
log(gotBool, typeof gotBool);
//=> false 'boolean'


var objectRange = Value.createBlob('bar', 'string', []);
var objectStart = objectRange[0];
var objectEnd = objectRange[1];

var object1 = {
    hashOffset: -1,
    bar: 'bar',
};

object1.hashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, objectStart, objectEnd, $h, object1.hashOffset);

var thing1 = Thing.setAll(Thing.none, {
    string: 'foo',
    number: 375.2,
    bool: true,
    object: object1,
});

log(thing1.string, thing1.number, thing1.bool, thing1.object.bar);
//=> foo 375.2 true bar

var searchHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($h, thing1.fileStart, thing1.fileEnd, $h, searchHashOffset);
hashOffset = HashTable.findHashOffset($hashTable, $h, searchHashOffset);
var type = $hashTable.hashes8[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isObject);
//=> 64
objectIndex = HashTable.objectIndex(hashOffset);
log($hashTable.objects[objectIndex] === thing1);
//=> true

log(hash($h, thing1.fileStart + offsets.string));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82

hashOffset = HashTable.findHashOffset($hashTable, $h, thing1.fileStart + offsets.string);
type = $hashTable.hashes8[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 128
var cacheIndex = $hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex];
var fileStart = $fileCache.fileRanges[2 * cacheIndex];
var fileEnd = $fileCache.fileRanges[2 * cacheIndex + 1];
log(pretty($fileCache.array, fileStart, fileEnd));
//=> blob 4\x00"foo
objectIndex = HashTable.objectIndex(hashOffset);
var gotString = $hashTable.objects[objectIndex].value;
log(gotString, typeof gotString);
//=> foo string

var thing2 = Thing.set(thing1, 'number', 42);
log(thing2.number);
//=> 42

var thing3 = Thing.set(thing2, 'number', 375.2);
log(thing3.number);
//=> 375.2
log(thing3 === thing1);
//=> true

var numberRange = Value.createBlob(42, 'number', []);
var numberStart = numberRange[0];
var numberEnd = numberRange[1];
var numberHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, numberStart, numberEnd, $h, numberHashOffset);
hashOffset = HashTable.findHashOffset($hashTable, $h, numberHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
var gotNumber = $hashTable.objects[objectIndex].value;
log(gotNumber, typeof gotNumber);
//=> 42 'number'

hashOffset = HashTable.findHashOffset($hashTable, $h, thing2.fileStart + offsets.bool);
objectIndex = HashTable.objectIndex(hashOffset);
var gotBool = $hashTable.objects[objectIndex].value;
log(gotBool, typeof gotBool);
//=> true 'boolean'
