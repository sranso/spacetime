'use strict';
require('../../test/helper');

global.$heap = Heap.create(256);
var $h = $heap.array;
var random = Random.create(526926);
global.$hashTable = HashTable.create(4, random);
global.$packData = PackData.create(512);
global.$fileCache = FileCache.create(3, 128);
global.$mold = Mold.create(32, 128, Type.minTree);

Unpack.initialize();

var fooRange = Blob.create('foo', []);
var fooStart = fooRange[0];
var fooEnd = fooRange[1];
var fooHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, fooStart, fooEnd, $h, fooHashOffset);
log(hash($h, fooHashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c

var barRange = Blob.create('bar', []);
var barStart = barRange[0];
var barEnd = barRange[1];
var barHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, barStart, barEnd, $h, barHashOffset);
log(hash($h, barHashOffset));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116

var treeRange = Tree.create({
    foo: 'blob',
    bar: 'blob',
    missing: 'tree',
}, []);
var treeStart = treeRange[0];
var treeEnd = treeRange[1];
var missingHash = new Uint8Array([0x1d,0xbf,0xb8,0xa3,0x73,0x21,0x96,0x64,0xf5,0xae,0xd3,0xa6,0x72,0xac,0xf4,0xbf,0x39,0xc8,0xfb,0x52]);
var barOffset = $fileCache.array.indexOf(0, treeStart + 12) + 1;
var fooOffset = $fileCache.array.indexOf(0, barOffset + 20) + 1;
var missingOffset = $fileCache.array.indexOf(0, fooOffset + 20) + 1;
Tree.setHash($fileCache.array, barOffset, $h, barHashOffset);
Tree.setHash($fileCache.array, fooOffset, $h, fooHashOffset);
Tree.setHash($fileCache.array, missingOffset, missingHash, 0);
log(pretty($fileCache.array, treeStart, treeEnd));
//=> tree 96\x00100644 bar\x00\xba\x0e\x16.\x1cGF\x9e?\xe4\xb3\x93\xa8\xbf\x8cV\x9f0\x21\x16100644 foo\x00\x19\x10\x28\x15f=\x23\xf8\xb7ZG\xe7\xa0\x19e\xdc\xdc\x96F\x8c40000 missing\x00\x1d\xbf\xb8\xa3s\x21\x96d\xf5\xae\xd3\xa6r\xac\xf4\xbf9\xc8\xfbR
var treeHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, treeStart, treeEnd, $h, treeHashOffset);
log(hash($h, treeHashOffset));
//=> df16029e64d49b34861f2c31f6f7cd9fa252a24d


var inputPackData = PackData.create(160);
inputPackData.array[11] = 3;  // Number of packed files.
inputPackData.nextOffset = 12;
PackData.packFile(inputPackData, $fileCache.array, fooStart, fooEnd);
PackData.packFile(inputPackData, $fileCache.array, barStart, barEnd);
PackData.packFile(inputPackData, $fileCache.array, treeStart, treeEnd);

var inputPackHashOffset = inputPackData.nextOffset;
log(inputPackData.nextOffset);
//=> 140
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackHashOffset, inputPack, inputPackHashOffset);
log(hash(inputPack, inputPackHashOffset));
//=> 2b2ead7e8ab2a99c6b65469323667ed7b48b3ca2








$packData.nextOffset = 123;

Unpack.unpack(inputPack);

log($fileCache.firstIndex, $fileCache.nextIndex);
//=> 1 0
log($fileCache.nextArrayOffset);
//=> 124


// foo
var hashOffset = HashTable.findHashOffset($hashTable, $h, fooHashOffset);
fooHashOffset = hashOffset;
log(hashOffset, hash($hashTable.hashes8, hashOffset));
//=> 4 '19102815663d23f8b75a47e7a01965dcdc96468c'
var flags = $hashTable.hashes8[HashTable.typeOffset(hashOffset)];
log(flags & HashTable.isFileCached);
//=> 0
var type = $hashTable.data8[HashTable.typeOffset(hashOffset)];
log(type, Type.blob);
//=> 4 4
var packOffset = $hashTable.data32[(hashOffset >> 2) + HashTable.data32_packOffset];
log(packOffset);
//=> 123
var fileRange = [];
PackData.extractFile($packData.array, packOffset, fileRange);
log(pretty($fileCache.array, fileRange[0], fileRange[1]));
//=> blob 3\x00foo


// bar
hashOffset = HashTable.findHashOffset($hashTable, $h, barHashOffset);
barHashOffset = hashOffset;
log(hashOffset);
//=> 68
log(hash($hashTable.hashes8, hashOffset));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116
flags = $hashTable.hashes8[HashTable.typeOffset(hashOffset)];
log(flags & HashTable.isFileCached);
//=> 128
var type = $hashTable.data8[HashTable.typeOffset(hashOffset)];
log(type, Type.blob);
//=> 4 4
var cacheIndex = $hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex];
log(cacheIndex);
//=> 1
log(hashOffset, $fileCache.hashOffsets[cacheIndex]);
//=> 68 68
var fileStart = $fileCache.fileRanges[2 * cacheIndex];
var fileEnd = $fileCache.fileRanges[2 * cacheIndex + 1];
log(fileStart, fileEnd);
//=> 10 20
log(pretty($fileCache.array, fileStart, fileEnd));
//=> blob 3\x00bar


// tree
hashOffset = HashTable.findHashOffset($hashTable, $h, treeHashOffset);
log(hashOffset);
//=> 24
log(hash($hashTable.hashes8, hashOffset));
//=> df16029e64d49b34861f2c31f6f7cd9fa252a24d
var moldIndex = $hashTable.data8[HashTable.typeOffset(hashOffset)];
log(moldIndex);
//=> 12
var data32_index = Mold.data32_size * moldIndex;
fileStart = $mold.data32[data32_index + Mold.data32_fileStart];
fileEnd = $mold.data32[data32_index + Mold.data32_fileEnd];
log(pretty($mold.fileArray, fileStart, fileEnd));
//=> tree 96\x00100644 bar\x00\xba\x0e\x16.\x1cGF\x9e?\xe4\xb3\x93\xa8\xbf\x8cV\x9f0\x21\x16100644 foo\x00\x19\x10\x28\x15f=\x23\xf8\xb7ZG\xe7\xa0\x19e\xdc\xdc\x96F\x8c40000 missing\x00\x1d\xbf\xb8\xa3s\x21\x96d\xf5\xae\xd3\xa6r\xac\xf4\xbf9\xc8\xfbR
var data8_index = Mold.data8_size * moldIndex;
var numChildren = $mold.data8[data8_index + Mold.data8_numChildren];
log(numChildren);
//=> 3
var dataOffset = hashOffset >> 2;
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
