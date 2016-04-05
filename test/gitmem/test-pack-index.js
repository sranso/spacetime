'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
var $h = $Heap.array;
var random = Random.create(526926);
global.$HashTable = HashTable.create(4, random);
global.$PackData = PackData.create(512);
global.$FileCache = FileCache.create(2, 22);

PackIndex.initialize();

var fooRange = Blob.create('foo', []);
var fooStart = fooRange[0];
var fooEnd = fooRange[1];
var fooHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($h, fooStart, fooEnd, $h, fooHashOffset);
log(hash($h, fooHashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c

var barRange = Blob.create('bar', []);
var barStart = barRange[0];
var barEnd = barRange[1];
var barHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($h, barStart, barEnd, $h, barHashOffset);
log(hash($h, barHashOffset));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116

var inputPackData = PackData.create(56);
inputPackData.array[11] = 2;  // Number of packed files.
inputPackData.nextOffset = 12;
PackData.packFile(inputPackData, $h, fooStart, fooEnd);
PackData.packFile(inputPackData, $h, barStart, barEnd);

var inputPackHashOffset = inputPackData.nextOffset;
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackHashOffset, inputPack, inputPackHashOffset);
log(hash(inputPack, inputPackHashOffset));
//=> c3bb7a426b16abdcf764597de428cc40d25bb9f8








global.$PackIndex = PackIndex.create($HashTable.n);
log($PackIndex.offsets.length);
//=> 4

$PackData.nextOffset = 123;

PackIndex.indexPack($PackIndex, inputPack);

log($FileCache.firstIndex, $FileCache.nextIndex);
//=> 1 0
log($FileCache.nextArrayOffset);
//=> 20
log($FileCache.fileStarts[0], $FileCache.fileStarts[1]);
//=> 0 10


// foo
var hashOffset = HashTable.findHashOffset($HashTable, $h, fooHashOffset);
log(hashOffset, hash($HashTable.array, hashOffset));
//=> 4 '19102815663d23f8b75a47e7a01965dcdc96468c'
var type = $HashTable.array[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 0
var objectIndex = HashTable.objectIndex(hashOffset);
var packOffset = $PackIndex.offsets[objectIndex];
log(objectIndex, packOffset);
//=> 0 123
var fileRange = [];
PackData.extractFile($PackData.array, packOffset, fileRange);
log(pretty($FileCache.array, fileRange[0], fileRange[1]));
//=> blob 3\x00foo


// bar
hashOffset = HashTable.findHashOffset($HashTable, $h, barHashOffset);
log(hashOffset, $FileCache.hashOffsets[1]);
//=> 68 68
log(hash($HashTable.array, hashOffset));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116
var type = $HashTable.array[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 128
objectIndex = HashTable.objectIndex(hashOffset);
var cacheIndex = $PackIndex.offsets[objectIndex];
packOffset = $FileCache.packIndexOffsets[cacheIndex];
log(objectIndex, cacheIndex, packOffset);
//=> 3 1 135
log($FileCache.fileStarts[cacheIndex], $FileCache.fileEnds[cacheIndex]);
//=> 10 20
log(pretty($FileCache.array, $FileCache.fileStarts[cacheIndex], $FileCache.fileEnds[cacheIndex]));
//=> blob 3\x00bar
