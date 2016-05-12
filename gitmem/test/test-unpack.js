'use strict';
require('../../test/helper');

var random = Random.create(526926);
global.$hashTable = HashTable.create(4, random);
global.$file = new Uint8Array(128);
global.$mold = Mold.create(32, 128);

var inputPackData = PackData.create(160);
inputPackData.array[11] = 3;  // Number of packed files.
inputPackData.nextOffset = 12;

var fooLength = Blob.create('foo', []);
var fooHash = new Uint8Array(20);
Sha1.hash($file, 0, fooLength, fooHash, 0);
log(hexHash(fooHash, 0));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
PackData.packFile(inputPackData, $file, 0, fooLength);

var barLength = Blob.create('bar', []);
var barHash = new Uint8Array(20);
Sha1.hash($file, 0, barLength, barHash, 0);
log(hexHash(barHash, 0));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116
PackData.packFile(inputPackData, $file, 0, barLength);

var treeLength = Tree.create({
    foo: 'blob',
    bar: 'blob',
    missing: 'tree',
});
var missingHash = new Uint8Array([0x1d,0xbf,0xb8,0xa3,0x73,0x21,0x96,0x64,0xf5,0xae,0xd3,0xa6,0x72,0xac,0xf4,0xbf,0x39,0xc8,0xfb,0x52]);
var barOffset = $file.indexOf(0, 12) + 1;
var fooOffset = $file.indexOf(0, barOffset + 20) + 1;
var missingOffset = $file.indexOf(0, fooOffset + 20) + 1;
Tree.setHash($file, barOffset, barHash, 0);
Tree.setHash($file, fooOffset, fooHash, 0);
Tree.setHash($file, missingOffset, missingHash, 0);
log(pretty($file, 0, treeLength));
//=> tree 96\x00100644 bar\x00\xba\x0e\x16.\x1cGF\x9e?\xe4\xb3\x93\xa8\xbf\x8cV\x9f0\x21\x16100644 foo\x00\x19\x10\x28\x15f=\x23\xf8\xb7ZG\xe7\xa0\x19e\xdc\xdc\x96F\x8c40000 missing\x00\x1d\xbf\xb8\xa3s\x21\x96d\xf5\xae\xd3\xa6r\xac\xf4\xbf9\xc8\xfbR
var treeHash = new Uint8Array(20);
Sha1.hash($file, 0, treeLength, treeHash, 0);
log(hexHash(treeHash, 0));
//=> df16029e64d49b34861f2c31f6f7cd9fa252a24d
PackData.packFile(inputPackData, $file, 0, treeLength);


var inputPackHashOffset = inputPackData.nextOffset;
log(inputPackData.nextOffset);
//=> 140
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackHashOffset, inputPack, inputPackHashOffset);
log(hexHash(inputPack, inputPackHashOffset));
//=> 2b2ead7e8ab2a99c6b65469323667ed7b48b3ca2








global.$packData = PackData.create(512);
$packData.nextOffset = 123;

Unpack.unpack(inputPack);

// foo
var hashOffset = HashTable.findHashOffset($hashTable, fooHash, 0);
var fooHashOffset = hashOffset;
log(hashOffset, hexHash($hashTable.hashes8, hashOffset));
//=> 4 '19102815663d23f8b75a47e7a01965dcdc96468c'
var type = $hashTable.data8[HashTable.typeOffset(hashOffset)];
log(type, Type.blob);
//=> 4 4
var dataOffset = hashOffset >> 2;
var packOffset = $hashTable.data32[dataOffset + HashTable.data32_packOffset];
log(packOffset);
//=> 123
var extractFileOutput = [];
PackData.extractFile($packData.array, packOffset, extractFileOutput);
var fileLength = extractFileOutput[0];
var nextPackOffset = extractFileOutput[1];
log(fileLength, nextPackOffset);
//=> 10 135
log(pretty($file, 0, fileLength));
//=> blob 3\x00foo


// bar
hashOffset = HashTable.findHashOffset($hashTable, barHash, 0);
var barHashOffset = hashOffset;
log(hashOffset);
//=> 68
log(hexHash($hashTable.hashes8, hashOffset));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116
type = $hashTable.data8[HashTable.typeOffset(hashOffset)];
log(type, Type.blob);
//=> 4 4
dataOffset = hashOffset >> 2;
packOffset = $hashTable.data32[dataOffset + HashTable.data32_packOffset];
log(packOffset);
//=> 135
extractFileOutput = [];
PackData.extractFile($packData.array, packOffset, extractFileOutput);
fileLength = extractFileOutput[0];
nextPackOffset = extractFileOutput[1];
log(fileLength, nextPackOffset);
//=> 10 147
log(pretty($file, 0, fileLength));
//=> blob 3\x00bar


// tree
hashOffset = HashTable.findHashOffset($hashTable, treeHash, 0);
log(hashOffset);
//=> 24
log(hexHash($hashTable.hashes8, hashOffset));
//=> df16029e64d49b34861f2c31f6f7cd9fa252a24d
type = $hashTable.data8[HashTable.typeOffset(hashOffset)];
log(type, Type.tree);
//=> 8 8
dataOffset = hashOffset >> 2;
var moldIndex = $hashTable.data32[dataOffset + HashTable.data32_moldIndex];
log(moldIndex);
//=> 1
var data32_index = Mold.data32_size * moldIndex;
var fileStart = $mold.data32[data32_index + Mold.data32_fileStart];
var fileEnd = $mold.data32[data32_index + Mold.data32_fileEnd];
log(pretty($mold.fileArray, fileStart, fileEnd));
//=> tree 96\x00100644 bar\x00\xba\x0e\x16.\x1cGF\x9e?\xe4\xb3\x93\xa8\xbf\x8cV\x9f0\x21\x16100644 foo\x00\x19\x10\x28\x15f=\x23\xf8\xb7ZG\xe7\xa0\x19e\xdc\xdc\x96F\x8c40000 missing\x00\x1d\xbf\xb8\xa3s\x21\x96d\xf5\xae\xd3\xa6r\xac\xf4\xbf9\xc8\xfbR
var data8_index = Mold.data8_size * moldIndex;
var numChildren = $mold.data8[data8_index + Mold.data8_numChildren];
log(numChildren);
//=> 3
var childHashOffset = $hashTable.data32[dataOffset + 0];
log(childHashOffset, barHashOffset);
//=> 68 68
childHashOffset = $hashTable.data32[dataOffset + 1];
log(childHashOffset, fooHashOffset);
//=> 4 4
var missingHashOffset = HashTable.findHashOffset($hashTable, missingHash, 0);
childHashOffset = $hashTable.data32[dataOffset + 2];
log(childHashOffset, missingHashOffset);
//=> 44 44
type = $hashTable.data8[HashTable.typeOffset(missingHashOffset)];
log(type, Type.pending);
//=> 1 1
