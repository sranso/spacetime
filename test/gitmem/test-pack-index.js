'use strict';
require('../helper');

global.$heap = Heap.create(1024);
var $h = $heap.array;
var random = Random.create(526926);
global.$hashTable = HashTable.create(4, random);
global.$packData = PackData.create(512);
global.$fileCache = FileCache.create(2, 22);

PackIndex.initialize();

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

var inputPackData = PackData.create(56);
inputPackData.array[11] = 2;  // Number of packed files.
inputPackData.nextOffset = 12;
PackData.packFile(inputPackData, $fileCache.array, fooStart, fooEnd);
PackData.packFile(inputPackData, $fileCache.array, barStart, barEnd);

var inputPackHashOffset = inputPackData.nextOffset;
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackHashOffset, inputPack, inputPackHashOffset);
log(hash(inputPack, inputPackHashOffset));
//=> c3bb7a426b16abdcf764597de428cc40d25bb9f8








global.$packIndex = PackIndex.create($hashTable.n);
log($packIndex.offsets.length);
//=> 4

$packData.nextOffset = 123;

PackIndex.indexPack($packIndex, inputPack);

log($fileCache.firstIndex, $fileCache.nextIndex);
//=> 1 0
log($fileCache.nextArrayOffset);
//=> 40
log($fileCache.fileStarts[0], $fileCache.fileStarts[1]);
//=> 20 30


// foo
var hashOffset = HashTable.findHashOffset($hashTable, $h, fooHashOffset);
log(hashOffset, hash($hashTable.array, hashOffset));
//=> 4 '19102815663d23f8b75a47e7a01965dcdc96468c'
var type = $hashTable.array[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 0
var objectIndex = HashTable.objectIndex(hashOffset);
var packOffset = $packIndex.offsets[objectIndex];
log(objectIndex, packOffset);
//=> 0 123
var fileRange = [];
PackData.extractFile($packData.array, packOffset, fileRange);
log(pretty($fileCache.array, fileRange[0], fileRange[1]));
//=> blob 3\x00foo


// bar
hashOffset = HashTable.findHashOffset($hashTable, $h, barHashOffset);
log(hashOffset, $fileCache.hashOffsets[1]);
//=> 68 68
log(hash($hashTable.array, hashOffset));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116
var type = $hashTable.array[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 128
objectIndex = HashTable.objectIndex(hashOffset);
var cacheIndex = $packIndex.offsets[objectIndex];
packOffset = $fileCache.packIndexOffsets[cacheIndex];
log(objectIndex, cacheIndex, packOffset);
//=> 3 1 135
log($fileCache.fileStarts[cacheIndex], $fileCache.fileEnds[cacheIndex]);
//=> 30 40
log(pretty($fileCache.array, $fileCache.fileStarts[cacheIndex], $fileCache.fileEnds[cacheIndex]));
//=> blob 3\x00bar
