'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
global.$ = $Heap.array;
var random = Random.create(526926);
global.$HashTable = HashTable.create(8, $Heap, random);
global.$Objects = Objects.create(8);
global.$PackData = PackData.create(512);
global.$FileCache = FileCache.create(3, 22);

PackIndex.initialize();

var fooRange = Blob.createFromString('foo');
var fooStart = fooRange[0];
var fooEnd = fooRange[1];
var fooHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, fooStart, fooEnd, $, fooHashOffset);
log(hash($, fooHashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c

var barRange = Blob.createFromString('bar');
var barStart = barRange[0];
var barEnd = barRange[1];
var barHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, barStart, barEnd, $, barHashOffset);
log(hash($, barHashOffset));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116

var inputPackData = PackData.create(56);
inputPackData.array[11] = 2;  // Number of packed files.
inputPackData.nextOffset = 12;
PackData.packFile(inputPackData, fooStart, fooEnd);
PackData.packFile(inputPackData, barStart, barEnd);

var inputPackHashOffset = inputPackData.nextOffset;
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackHashOffset, inputPack, inputPackHashOffset);
log(hash(inputPack, inputPackHashOffset));
//=> c3bb7a426b16abdcf764597de428cc40d25bb9f8








var index = PackIndex.create($HashTable.n);
log(index.offsets.length);
//=> 8

PackIndex.indexPack(index, inputPack);

var hashOffset = HashTable.findHashOffset($HashTable, fooHashOffset);
log(hashOffset, hash($, hashOffset));
//=> 4 '19102815663d23f8b75a47e7a01965dcdc96468c'
var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var packOffset = index.offsets[objectIndex];
log(objectIndex, packOffset);
//=> 0 0

var file = PackData.extractFile($PackData, $PackData.array, packOffset, $Heap);
var fileStart = file[0];
var fileEnd = file[1];
log(pretty($, fileStart, fileEnd));
//=> blob 3\x00foo

hashOffset = HashTable.findHashOffset($HashTable, barHashOffset);
log(hashOffset, hash($, hashOffset));
//=> 132 'ba0e162e1c47469e3fe4b393a8bf8c569f302116'
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
packOffset = index.offsets[objectIndex];
log(objectIndex, packOffset);
//=> 6 12

log($FileCache.firstIndex, $FileCache.nextIndex);
//=> 0 2
log($FileCache.heap.nextOffset);
//=> 0
log($FileCache.fileStarts[0], $FileCache.fileStarts[1]);
//=> 0 10
var cacheObject = $Objects.table[objectIndex];
log(cacheObject.flags & Objects.isFullObject);
//=> 0
log(cacheObject.fileStart, cacheObject.fileEnd);
//=> 10 20
log(pretty($FileCache.heap.array, cacheObject.fileStart, cacheObject.fileEnd));
//=> blob 3\x00bar
