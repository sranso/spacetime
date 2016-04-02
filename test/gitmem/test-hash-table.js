'use strict';
require('../helper');

global.$Heap = Heap.create(256);
var $h = $Heap.array;

var random = Random.create(42);
var hashTable = HashTable.create(8, random);
log(hashTable.hashes.length);
//=> 192
log(hashTable.n);
//=> 8
log(hashTable.hashBitsToShift);
//=> 29

Convert.stringToExistingArray($h, 0, 'abc');
var searchHashOffset = 3;
Sha1.hash($h, 0, 3, $h, searchHashOffset);
log(hash($h, searchHashOffset));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hashOffset = HashTable.findHashOffset(hashTable, $h, searchHashOffset);
log(hashOffset, ~hashOffset);
//=> -69 68
hashOffset = ~hashOffset;

log(HashTable.objectIndex(hashOffset));
//=> 3

HashTable.setHash(hashTable, hashOffset, $h, searchHashOffset);
log(hash(hashTable.hashes, hashOffset));
//=> a9993e364706816aba3e25717850c26c9cd0d89d
hashOffset = HashTable.findHashOffset(hashTable, $h, searchHashOffset);
log(hashOffset);
//=> 68






// var hashInBlock1 = a9993e364706816aba3e25717850c26c9cd0d89d
var hashInBlock2 = new Uint8Array([0x76,0xd1,0x07,0x98,0x15,0xa1,0xb0,0x42,0x0f,0x2b,0xe8,0x95,0x1f,0x4a,0x98,0x56,0xd3,0xf8,0x67,0x9c]);
var hashInBlock3 = new Uint8Array([0xc2,0x53,0x6d,0xf4,0x3b,0xa3,0x2d,0x99,0x4d,0xe2,0xc5,0xc9,0xbf,0xf8,0x38,0x83,0x12,0xb1,0xb6,0x34]);
var hashInNextBlock1 = new Uint8Array([0xdc,0xd6,0x7d,0x10,0x87,0xe0,0x7b,0x87,0xa5,0x9b,0xb9,0x0a,0x93,0x24,0xa3,0x69,0x47,0x9c,0xcb,0x75]);
Convert.arrayToExistingArray($h, 40, hashInBlock2);
Convert.arrayToExistingArray($h, 60, hashInBlock3);
Convert.arrayToExistingArray($h, 80, hashInNextBlock1);

hashOffset = ~HashTable.findHashOffset(hashTable, $h, 40);
log(hashOffset, HashTable.objectIndex(hashOffset));
//=> 88 4
HashTable.setHash(hashTable, hashOffset, $h, 40);
hashOffset = ~HashTable.findHashOffset(hashTable, $h, 60);
log(hashOffset, HashTable.objectIndex(hashOffset));
//=> 108 5
HashTable.setHash(hashTable, hashOffset, $h, 60);
hashOffset = ~HashTable.findHashOffset(hashTable, $h, 80);
log(hashOffset, HashTable.objectIndex(hashOffset));
//=> 4 0
HashTable.setHash(hashTable, hashOffset, $h, 80);
