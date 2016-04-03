'use strict';
require('../helper');

global.$Heap = Heap.create(256);
var $h = $Heap.array;
var random = Random.create(91285);
global.$HashTable = HashTable.create(4, random);
global.$Objects = Objects.create(4);
global.$PackIndex = PackIndex.create(4);
global.$PackData = PackData.create(128);
global.$FileCache = FileCache.create(2, 128);

PackIndex.initialize();

var clone = function (original) {
    return {
        fileStart: -1,
        fileEnd: -1,
        hashOffset: -1,

        foo: original.foo,
    };
};

var none = clone({foo: ''});

var checkoutFile = function ($f, fileStart, fileEnd) {
    var object = clone(none);
    var blobArray = $f.subarray(Blob.contentStart($f, fileStart), fileEnd);
    object.foo = String.fromCharCode.apply(null, blobArray);
    return object;
};




var blobRange = Blob.create('foo', []);
var blobStart = blobRange[0];
var blobEnd = blobRange[1];

var blobHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($h, blobStart, blobEnd, $h, blobHashOffset);
log(hash($h, blobHashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c

var hashOffset = ~HashTable.findHashOffset($HashTable, $h, blobHashOffset);
HashTable.setHash($HashTable, hashOffset, $h, blobHashOffset);
var objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, $h, blobStart, blobEnd);


// Checkout from PackData
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
log(object.foo);
//=> foo
log(object.hashOffset, hashOffset);
//=> 4 4
log(hash($HashTable.array, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
var savedObject = $Objects.table[objectIndex];
log(savedObject.foo);
//=> foo
log(savedObject.flags & Objects.isFullObject);
//=> 1
log(savedObject.fileEnd, $FileCache.heap.nextOffset);
//=> 10 10


// Checkout from $Objects.table
var packData = $PackData;
global.$PackData = null;
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
log(object.foo);
//=> foo
log(hash($HashTable.array, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c


// Checkout from $FileCache
$Objects.table[objectIndex] = null;
$FileCache.nextIndex = 0;
var fileRange = [];
PackData.extractFile(packData.array, $PackIndex.offsets[objectIndex], fileRange);
var fileStart = fileRange[0];
var fileEnd = fileRange[1];
FileCache.registerCachedFile($FileCache, fileStart, fileEnd, hashOffset);
log($Objects.table[objectIndex].flags & Objects.isFullObject);
//=> 0
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
log(object.foo);
//=> foo
log(hash($HashTable.array, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
log(object.flags & Objects.isFullObject);
//=> 1
