'use strict';
require('../helper');

var random = Random.create(526926);
global.$hashTable = HashTable.create(4, random);
global.$packIndex = PackIndex.create(4);

var fileCache = FileCache.create(3, 8);
log(fileCache.fileStarts.length);
//=> 3
log(fileCache.array.length);
//=> 8

FileCache.malloc(fileCache, 7);
log(fileCache.array.length);
//=> 8

var fileStart = 0;
var fileEnd = 7;
var hashOffset = 24;
var objectIndex = HashTable.objectIndex(hashOffset);
log(objectIndex);
//=> 1
$packIndex.offsets[objectIndex] = 12345;

FileCache.registerCachedFile(fileCache, fileStart, fileEnd, hashOffset);
log(fileCache.firstIndex, fileCache.nextIndex);
//=> 0 1
var type = $hashTable.array[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 128
log($packIndex.offsets[objectIndex]);
//=> 0
log(fileCache.fileStarts[0]);
//=> 0
log(fileCache.fileEnds[0]);
//=> 7
log(fileCache.hashOffsets[0]);
//=> 24
log(fileCache.packIndexOffsets[0]);
//=> 12345


// Expand the array to 8X
fileCache.nextArrayOffset = fileEnd;
FileCache.malloc(fileCache, 4);
log(fileCache.array.length);
//=> 32
log(fileCache.nextArrayOffset);
//=> 7


// Purge the cache to make space
fileCache.nextArrayOffset = 0;
FileCache.malloc(fileCache, 3);
log(fileCache.firstIndex, fileCache.nextIndex);
//=> 1 1
log($packIndex.offsets[objectIndex]);
//=> 12345
type = $hashTable.array[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 0


// Register file at end
fileStart = 30;
fileEnd = 32;
hashOffset = 44;
objectIndex = HashTable.objectIndex(hashOffset);
$packIndex.offsets[objectIndex] = 54321;
FileCache.registerCachedFile(fileCache, fileStart, fileEnd, hashOffset);
log(fileCache.firstIndex, fileCache.nextIndex);
//=> 1 2
log($packIndex.offsets[objectIndex]);
//=> 1
log(fileCache.fileStarts[2]);
//=> 0

// Register file at beginning
fileStart = 0;
fileEnd = 7;
hashOffset = 24;
FileCache.registerCachedFile(fileCache, fileStart, fileEnd, hashOffset);
log(fileCache.firstIndex, fileCache.nextIndex);
//=> 1 0

fileCache.nextArrayOffset = 29;
FileCache.malloc(fileCache, 4);
log(fileCache.array.length);
//=> 32

// Wrap around
log(fileCache.nextArrayOffset);
//=> 0

// Both the file at the end and at the beginning get cleared
log(fileCache.firstIndex, fileCache.nextIndex);
//=> 0 0
log($packIndex.offsets[objectIndex]);
//=> 54321
type = $hashTable.array[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 0



hashOffset = 24;
FileCache.registerCachedFile(fileCache, fileStart, fileEnd, hashOffset);
hashOffset = 44;
FileCache.registerCachedFile(fileCache, fileStart, fileEnd, hashOffset);
FileCache.registerCachedFile(fileCache, fileStart, fileEnd, hashOffset);

// Avoid overflow by clearing first entry
log(fileCache.firstIndex, fileCache.nextIndex);
//=> 1 0
hashOffset = 24;
log($packIndex.offsets[HashTable.objectIndex(hashOffset)]);
//=> 12345
type = $hashTable.array[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 0
