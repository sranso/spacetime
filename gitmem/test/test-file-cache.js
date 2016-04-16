'use strict';
require('../../test/helper');

var random = Random.create(526926);
global.$hashTable = HashTable.create(4, random);

var fileCache = FileCache.create(3, 8);
log(fileCache.hashOffsets.length);
//=> 3
log(fileCache.array.length);
//=> 8

FileCache.malloc(fileCache, 7);
log(fileCache.array.length);
//=> 8

var fileStart = 0;
var fileEnd = 7;
var hashOffset = 24;
$hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex] = 12345;

FileCache.registerCachedFile(fileCache, fileStart, fileEnd, hashOffset);
log(fileCache.firstIndex, fileCache.nextIndex);
//=> 0 1
var type = $hashTable.hashes8[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 128
log($hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex]);
//=> 0
log(fileCache.fileRanges[0], fileCache.fileRanges[1]);
//=> 0 7
log(fileCache.hashOffsets[0]);
//=> 24
log(fileCache.flags[0] & FileCache.hasOverwrittenData32);
//=> 4
log(fileCache.overwrittenData32[0]);
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
log($hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex]);
//=> 12345
type = $hashTable.hashes8[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 0


// Register file at end
fileStart = 30;
fileEnd = 32;
hashOffset = 44;
$hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex] = 54321;
FileCache.registerCachedFile(fileCache, fileStart, fileEnd, hashOffset);
log(fileCache.firstIndex, fileCache.nextIndex);
//=> 1 2
log($hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex]);
//=> 1
log(fileCache.fileRanges[2], fileCache.fileRanges[3]);
//=> 30 32

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
log($hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex]);
//=> 12345
hashOffset = 44;
log($hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex]);
//=> 54321
type = $hashTable.hashes8[HashTable.typeOffset(hashOffset)];
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
log($hashTable.data32[(hashOffset >> 2) + HashTable.data32_cacheIndex]);
//=> 12345
type = $hashTable.hashes8[HashTable.typeOffset(hashOffset)];
log(type & HashTable.isFileCached);
//=> 0
