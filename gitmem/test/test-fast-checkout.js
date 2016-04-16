'use strict';
require('../../test/helper');

global.$heap = Heap.create(256);
var $h = $heap.array;
var random = Random.create(91285);
global.$hashTable = HashTable.create(4, random);
global.$packData = PackData.create(128);
global.$fileCache = FileCache.create(2, 128);

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
$hashTable.data32[(hashOffset >> 2) + HashTable.data32_packOffset] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, blobStart, blobEnd);


// Checkout from PackData
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
log(object.foo);
//=> foo
log(object.hashOffset, hashOffset);
//=> 4 4
log(hash($hashTable.hashes8, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
var type = $hashTable.hashes8[HashTable.typeOffset(object.hashOffset)];
log(type & HashTable.isObject);
//=> 64
var objectIndex = HashTable.objectIndex(object.hashOffset);
var savedObject = $hashTable.objects[objectIndex];
log(savedObject.foo, object === savedObject);
//=> foo true
log(type & HashTable.isFileCached);
//=> 128
var cacheIndex = $hashTable.data32[(object.hashOffset >> 2) + HashTable.data32_cacheIndex];
var fileStart = $fileCache.fileRanges[2 * cacheIndex];
var fileEnd = $fileCache.fileRanges[2 * cacheIndex + 1];
log(fileEnd, $fileCache.nextArrayOffset);
//=> 20 20
log(pretty($fileCache.array, fileStart, fileEnd));
//=> blob 3\x00foo


// Checkout from $hashTable.objects
var packData = $packData;
global.$packData = null;
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
global.$packData = packData;
log(object.foo, object === savedObject);
//=> foo true
log(hash($hashTable.hashes8, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c


// Checkout from $fileCache
$hashTable.hashes8[HashTable.typeOffset(object.hashOffset)] &= ~HashTable.isObject;
var object = FastCheckout.checkout($h, blobHashOffset, checkoutFile);
log(object.foo, object === savedObject);
//=> foo false
log(hash($hashTable.hashes8, object.hashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
var type = $hashTable.hashes8[HashTable.typeOffset(object.hashOffset)];
log(type & HashTable.isObject);
//=> 64
