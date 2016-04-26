'use strict';
require('../../../test/helper');

var random = Random.create(29923321);
global.$hashTable = HashTable.create(16, random);
global.$fileCache = FileCache.create(8, 128);
global.$mold = Mold.create(4, 128, 1);

var treeRange = Tree.create({
    bar: 'blob',
    foo: 'blob',
    www: 'blob',
}, []);
var moldIndex = Mold.process($mold, treeRange[0], treeRange[1]);
var data32_index = Mold.data32_size * moldIndex;
var fileStart = $mold.data32[data32_index + Mold.data32_fileStart];
var fileEnd = $mold.data32[data32_index + Mold.data32_fileEnd];
var treeHash = new Uint8Array(20);
Sha1.hash($mold.fileArray, fileStart, fileEnd, treeHash, 0);
log(hexHash(treeHash, 0));
//=> 4f6c3684ecbfbdb53e78302549bae39be9024550

var barHash = new Uint8Array([0x44,0x26,0xd3,0xa5,0xbb,0xf5,0x7d,0x7f,0xae,0xcc,0xe6,0xc5,0x5d,0xd4,0xf9,0xf2,0x57,0x34,0x5b,0x32]);
var fooHash = new Uint8Array([0x20,0xff,0xd3,0xc6,0xdc,0xf3,0x3e,0x56,0x14,0xb8,0x18,0xe3,0x24,0x25,0x4f,0xd5,0x1c,0xc9,0x21,0xf6]);
var wwwHash = new Uint8Array([0x4c,0xa3,0xc5,0xe3,0x51,0x32,0x6f,0xcc,0x06,0x59,0x3d,0x72,0x6c,0xfd,0x0a,0x35,0xe9,0x8d,0x88,0xae]);
var barHashOffset = ~HashTable.findHashOffset($hashTable, barHash, 0);
var fooHashOffset = ~HashTable.findHashOffset($hashTable, fooHash, 0);
var wwwHashOffset = ~HashTable.findHashOffset($hashTable, wwwHash, 0);
var treeHashOffset = ~HashTable.findHashOffset($hashTable, treeHash, 0);
HashTable.setHash($hashTable, barHashOffset, barHash, 0);
HashTable.setHash($hashTable, fooHashOffset, fooHash, 0);
HashTable.setHash($hashTable, treeHashOffset, wwwHash, 0);
HashTable.setHash($hashTable, treeHashOffset, treeHash, 0);
$hashTable.data8[HashTable.typeOffset(treeHashOffset)] = moldIndex;

var tree1 = set(treeHashOffset,
                0, barHashOffset,
                1, fooHashOffset,
                2, wwwHashOffset);

var dataOffset = tree1 >> 2;
log(hexHash($hashTable.hashes8, tree1));
//=> 708acb9d9bc0d41784aeb81d5b3c4b0425cb9f97
log($hashTable.data32[dataOffset + 0], barHashOffset);
//=> 68 68
log($hashTable.data32[dataOffset + 1], fooHashOffset);
//=> 196 196
log($hashTable.data32[dataOffset + 2], wwwHashOffset);
//=> 4 4

var tree2 = set(tree1, 1, wwwHashOffset);
dataOffset = tree2 >> 2;
log(hexHash($hashTable.hashes8, tree2));
//=> b38c79cd518e1cd225d738604d57b999670d8b14
log($hashTable.data32[dataOffset + 0], barHashOffset);
//=> 68 68
log($hashTable.data32[dataOffset + 1], wwwHashOffset);
//=> 4 4
log($hashTable.data32[dataOffset + 2], wwwHashOffset);
//=> 4 4

var tree3 = set(tree1, 1, wwwHashOffset);
log(tree3, tree2);
//=> 344 344
