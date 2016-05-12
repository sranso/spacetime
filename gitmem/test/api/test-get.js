'use strict';
require('../../../test/helper');

var random = Random.create(189869);
global.$hashTable = HashTable.create(4, random);
global.$file = new Uint8Array(128);
global.$mold = Mold.create(4, 128);

var treeLength = Tree.create({
    bar: 'blob',
    foo: 'blob',
});
var moldIndex = Mold.process($mold, treeLength);
var data32_index = Mold.data32_size * moldIndex;
var fileStart = $mold.data32[data32_index + Mold.data32_fileStart];
var fileEnd = $mold.data32[data32_index + Mold.data32_fileEnd];
var holeOffsets = Mold.data8_size * moldIndex + Mold.data8_holeOffsets;
var barHash = new Uint8Array([0x44,0x26,0xd3,0xa5,0xbb,0xf5,0x7d,0x7f,0xae,0xcc,0xe6,0xc5,0x5d,0xd4,0xf9,0xf2,0x57,0x34,0x5b,0x32]);
var fooHash = new Uint8Array([0x20,0xff,0xd3,0xc6,0xdc,0xf3,0x3e,0x56,0x14,0xb8,0x18,0xe3,0x24,0x25,0x4f,0xd5,0x1c,0xc9,0x21,0xf6]);
Tree.setHash($mold.fileArray, fileStart + $mold.data8[holeOffsets + 0], fooHash, 0);
Tree.setHash($mold.fileArray, fileStart + $mold.data8[holeOffsets + 1], barHash, 0);
var treeHash = new Uint8Array(20);
Sha1.hash($mold.fileArray, fileStart, fileEnd, treeHash, 0);
log(hexHash(treeHash, 0));
//=> d5bec1220e8ac3041ad459339d079abc7c21133c

var barHashOffset = ~HashTable.findHashOffset($hashTable, barHash, 0);
var fooHashOffset = ~HashTable.findHashOffset($hashTable, fooHash, 0);
var treeHashOffset = ~HashTable.findHashOffset($hashTable, treeHash, 0);
HashTable.setHash($hashTable, barHashOffset, barHash, 0);
HashTable.setHash($hashTable, fooHashOffset, fooHash, 0);
HashTable.setHash($hashTable, treeHashOffset, treeHash, 0);
log(hexHash($hashTable.hashes8, treeHashOffset));
//=> d5bec1220e8ac3041ad459339d079abc7c21133c
var dataOffset = treeHashOffset >> 2;
$hashTable.data32[dataOffset + 0] = barHashOffset;
$hashTable.data32[dataOffset + 1] = fooHashOffset;
$hashTable.data32[dataOffset + HashTable.data32_moldIndex] = moldIndex;
$hashTable.data8[HashTable.typeOffset(treeHashOffset)] = Type.tree;

log(get(treeHashOffset, 0), barHashOffset);
//=> 68 68
log(get(treeHashOffset, 1), fooHashOffset);
//=> 4 4
log(get(treeHashOffset, 2));
//=> 0
