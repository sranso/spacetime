'use strict';
require('../helper');

global.$Heap = Heap.create(256);
global.$ = $Heap.array;
global.$Random = Random.create(91285);
global.$HashTable = HashTable.create(4, $Heap, $Random);
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

var checkoutFile = function (fileStart, fileEnd) {
    var object = clone(none);
    var blobArray = $.subarray(Blob.contentStart(fileStart), fileEnd);
    object.foo = String.fromCharCode.apply(null, blobArray);
    return object;
};




var blobRange = Blob.createFromString('foo');
var blobStart = blobRange[0];
var blobEnd = blobRange[1];

var blobHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, blobStart, blobEnd, $, blobHashOffset);
log(hash($, blobHashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c

var hashOffset = ~HashTable.findHashOffset($HashTable, blobHashOffset);
HashTable.setHash($HashTable, hashOffset, blobHashOffset);
var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, blobStart, blobEnd);


// Checkout from PackData
var object = FastCheckout.checkout(blobHashOffset, checkoutFile);
log(object.foo);
//=> foo
log(hash($, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
log($HashTable.objects[objectIndex].foo);
//=> foo
var flagsOffset = HashTable.flagsOffset($HashTable, object.hashOffset);
log($[flagsOffset] & HashTable.isObject);
//=> 1


// Checkout from $HashTable.objects
var packData = $PackData;
global.$PackData = null;
var object = FastCheckout.checkout(blobHashOffset, checkoutFile);
log(object.foo);
//=> foo
log(hash($, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c


// Checkout from $FileCache
$HashTable.objects[objectIndex] = null;
$[flagsOffset] &= ~HashTable.isObject;
var fileRange = PackData.extractFile(packData, packData.array, $PackIndex.offsets[objectIndex], $FileCache.heap);
var fileStart = fileRange[0];
var fileEnd = fileRange[1];
FileCache.registerCachedFile($FileCache, fileStart, fileEnd, hashOffset);
log($[flagsOffset] & HashTable.isCachedFile);
//=> 2
var object = FastCheckout.checkout(blobHashOffset, checkoutFile);
log(object.foo);
//=> foo
log(hash($, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
log($[flagsOffset] & HashTable.isObject);
//=> 1
log($[flagsOffset] & HashTable.isCachedFile);
//=> 0
