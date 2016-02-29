'use strict';
require('../helper');

var random = Random.create(42);
global.$Heap = Heap.create(1024);
global.$ = $Heap.array;
$Heap.nextOffset = 512;

var table = HashTable.create(8, $Heap, random);
log(table.hashesOffset, $Heap.nextOffset);
//=> 512 704
log(table.n, table.objects.length);
//=> 8 8
log(table.hashBitsToShift);
//=> 29

GitConvert.stringToExistingArray($, 0, 'abc');
Sha1.hash($, 0, 3, $, 3);
log(hash($, 3));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var searchHashOffset = 3;
var hashOffset = HashTable.findHashOffset(table, searchHashOffset);
log(hashOffset, ~hashOffset);
//=> -581 580
hashOffset = ~hashOffset;

log(HashTable.objectIndex(table, hashOffset));
//=> 3

log(HashTable.flagsOffset(table, hashOffset));
//=> 577

HashTable.setHash(table, hashOffset, searchHashOffset);
log(hash($, hashOffset));
//=> a9993e364706816aba3e25717850c26c9cd0d89d
hashOffset = HashTable.findHashOffset(table, searchHashOffset);
log(hashOffset);
//=> 580






// var hashInBlock1 = a9993e364706816aba3e25717850c26c9cd0d89d
var hashInBlock2 = new Uint8Array([0x76,0xd1,0x07,0x98,0x15,0xa1,0xb0,0x42,0x0f,0x2b,0xe8,0x95,0x1f,0x4a,0x98,0x56,0xd3,0xf8,0x67,0x9c]);
var hashInBlock3 = new Uint8Array([0xc2,0x53,0x6d,0xf4,0x3b,0xa3,0x2d,0x99,0x4d,0xe2,0xc5,0xc9,0xbf,0xf8,0x38,0x83,0x12,0xb1,0xb6,0x34]);
var hashInNextBlock1 = new Uint8Array([0xdc,0xd6,0x7d,0x10,0x87,0xe0,0x7b,0x87,0xa5,0x9b,0xb9,0x0a,0x93,0x24,0xa3,0x69,0x47,0x9c,0xcb,0x75]);
GitConvert.setHash($, 40, hashInBlock2, 0);
GitConvert.setHash($, 60, hashInBlock3, 0);
GitConvert.setHash($, 80, hashInNextBlock1, 0);

hashOffset = HashTable.findHashOffset(table, 40);
log(~hashOffset, HashTable.objectIndex(table, ~hashOffset));
//=> 600 4
HashTable.setHash(table, ~hashOffset, 40);
hashOffset = HashTable.findHashOffset(table, 60);
log(~hashOffset, HashTable.objectIndex(table, ~hashOffset));
//=> 620 5
HashTable.setHash(table, ~hashOffset, 60);
hashOffset = HashTable.findHashOffset(table, 80);
log(~hashOffset, HashTable.objectIndex(table, ~hashOffset));
//=> 516 0
HashTable.setHash(table, ~hashOffset, 80);







GitConvert.stringToExistingArray($, 100, 'foo');
Sha1.hash($, 100, 103, $, 103);
searchHashOffset = 103;
log(hash($, 103));
//=> 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33

var object = {
    foo: true,
    bar: 'buzz',
    fileStart: 100,
    fileEnd: 103,
    hashOffset: searchHashOffset,
};

HashTable.save(table, object);
hashOffset = HashTable.findHashOffset(table, searchHashOffset);
log(hashOffset);
//=> 536
log(hash($, hashOffset));
//=> 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33
var objectIndex = HashTable.objectIndex(table, hashOffset);
log(objectIndex);
//=> 1
var gotObject = table.objects[objectIndex];
log(gotObject.foo, gotObject.bar);
//=> true 'buzz'

var flagsOffset = HashTable.flagsOffset(table, hashOffset);
log(flagsOffset);
//=> 514
log($[flagsOffset], $[flagsOffset] & HashTable.isObject);
//=> 1 1

log(HashTable.prettyPrint(table));
//=> 1: #<0beec7 foo=true bar=buzz>
