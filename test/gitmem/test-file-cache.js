'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
global.$ = $Heap.array;
var random = Random.create(526926);
global.$HashTable = HashTable.create(8, random);
global.$Objects = Objects.create(8);

var cache = FileCache.create(8, 128);
log(cache.fileStarts.length);
//=> 8
log(cache.heap.capacity, cache.heap.array.length);
//=> 128 128

cache.heap.nextOffset = 100;

FileCache.resize(cache, 0);
log(cache.heap.nextOffset);
//=> 100
log(cache.heap.capacity, cache.heap.array.length);
//=> 256 256

GitConvert.stringToExistingArray(cache.heap.array, 200, 'foo bar');
cache.heap.nextOffset = 203;
FileCache.resize(cache, 500);
log(cache.heap.capacity);
//=> 1024
log(pretty(cache.heap.array, 199, 207));
//=> \x00foo\x00\x00\x00\x00







cache = FileCache.create(3, 32);
var fileStart = 29;
var fileEnd = fileStart + 3;
GitConvert.stringToExistingArray(cache.heap.array, fileStart, 'foo');
var tempHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash(cache.heap.array, fileStart, fileEnd, $, tempHashOffset);
var hashOffset = ~HashTable.findHashOffset($HashTable, $, tempHashOffset);

FileCache.registerCachedFile(cache, fileStart, fileEnd, hashOffset);
log(cache.firstIndex, cache.nextIndex);
//=> 0 1
log(cache.fileStarts[0]);
//=> 29
var objectIndex = HashTable.objectIndex(hashOffset);
var cacheObject = $Objects.table[objectIndex];
log(objectIndex, cacheObject.fileEnd);
//=> 6 32
log(cacheObject.flags & Objects.isFullObject);
//=> 0


// Registering will clear old cached files
var oldObjectIndex = objectIndex;
GitConvert.stringToExistingArray(cache.heap.array, fileStart, 'bar');
Sha1.hash(cache.heap.array, fileStart, fileEnd, $, tempHashOffset);
var hashOffset = ~HashTable.findHashOffset($HashTable, $, tempHashOffset);
FileCache.registerCachedFile(cache, fileStart, fileEnd, hashOffset);
log(cache.firstIndex, cache.nextIndex);
//=> 1 2
log($Objects.table[oldObjectIndex]);
//=> null
objectIndex = HashTable.objectIndex(hashOffset);
cacheObject = $Objects.table[objectIndex];
log(objectIndex, cacheObject.fileEnd);
//=> 0 32
log(cacheObject & Objects.isFullObject);
//=> 0



// Wrap around nextIndex, and leave current cached files there
// if non overlapping
oldObjectIndex = objectIndex;
FileCache.registerCachedFile(cache, fileStart + 1, fileStart + 1, hashOffset);
log(cache.firstIndex, cache.nextIndex);
//=> 1 0
log($Objects.table[oldObjectIndex].fileEnd);
//=> 30

// Don't overflow the nextIndex
GitConvert.stringToExistingArray(cache.heap.array, fileStart + 2, 'Z');
Sha1.hash(cache.heap.array, fileStart + 2, fileEnd, $, tempHashOffset);
hashOffset = ~HashTable.findHashOffset($HashTable, $, tempHashOffset);
FileCache.registerCachedFile(cache, fileStart + 2, fileStart + 2, hashOffset);
log(cache.firstIndex, cache.nextIndex);
//=> 2 1
objectIndex = HashTable.objectIndex(hashOffset);
log($Objects.table[objectIndex].fileEnd);
//=> 31



// Don't rewind if 1/8 space left
oldObjectIndex = objectIndex;
cache.heap.nextOffset = 28;
FileCache.maybeRewindNextOffset(cache);
log(cache.heap.nextOffset);
//=> 28

cache.heap.nextOffset = 29;
FileCache.maybeRewindNextOffset(cache);
log(cache.heap.nextOffset);
//=> 0
log(cache.firstIndex, cache.nextIndex);
//=> 1 1
log($Objects.table[oldObjectIndex]);
//=> null
