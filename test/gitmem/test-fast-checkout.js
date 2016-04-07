'use strict';
require('../helper');

global.$heap = Heap.create(256);
var $h = $heap.array;
var random = Random.create(91285);
global.$hashTable = HashTable.create(4, random);
global.$objects = Objects.create(4);
global.$packIndex = PackIndex.create(4);
global.$packData = PackData.create(128);
global.$fileCache = FileCache.create(2, 128);

PackIndex.initialize();

var clone = function (original) {
    return {
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

var blobHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, blobStart, blobEnd, $h, blobHashOffset);
log(hash($h, blobHashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c

var hashOffset = ~HashTable.findHashOffset($hashTable, $h, blobHashOffset);
HashTable.setHash($hashTable, hashOffset, $h, blobHashOffset);
var objectIndex = HashTable.objectIndex(hashOffset);
$packIndex.offsets[objectIndex] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, blobStart, blobEnd);


// Checkout from PackData
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
log(object.foo);
//=> foo
log(object.hashOffset, hashOffset);
//=> 4 4
log(hash($hashTable.array, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
var type = $hashTable.array[HashTable.typeOffset(object.hashOffset)];
log(type & HashTable.isObject);
//=> 64
var savedObject = $objects.table[objectIndex];
log(savedObject.foo, object === savedObject);
//=> foo true
log(type & HashTable.isFileCached);
//=> 128
var objectIndex = HashTable.objectIndex(object.hashOffset);
var cacheIndex = $packIndex.offsets[objectIndex];
log($fileCache.fileEnds[cacheIndex], $fileCache.nextArrayOffset);
//=> 20 20
log(pretty($fileCache.array, $fileCache.fileStarts[cacheIndex], $fileCache.fileEnds[cacheIndex]));
//=> blob 3\x00foo


// Checkout from $objects.table
var packData = $packData;
global.$packData = null;
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
global.$packData = packData;
log(object.foo, object === savedObject);
//=> foo true
log(hash($hashTable.array, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c


// Checkout from $fileCache
$hashTable.array[HashTable.typeOffset(object.hashOffset)] &= ~HashTable.isObject;
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
log(object.foo, object === savedObject);
//=> foo false
log(hash($hashTable.array, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
var type = $hashTable.array[HashTable.typeOffset(object.hashOffset)];
log(type & HashTable.isObject);
//=> 64
