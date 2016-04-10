'use strict';
global.FileCache = {};
(function () {

FileCache.create = function (maxNumCached, arrayCapacity) {
    return {
        array: new Uint8Array(arrayCapacity),
        fileStarts: new Uint32Array(maxNumCached),
        fileEnds: new Uint32Array(maxNumCached),
        hashOffsets: new Uint32Array(maxNumCached),
        overwrittenData32: new Uint32Array(maxNumCached),
        nextArrayOffset: 0,
        nextIndex: 0,
        firstIndex: 0,
    };
};

FileCache.registerCachedFile = function (fileCache, fileStart, fileEnd, hashOffset) {
    var currentIndex = fileCache.nextIndex;
    var data32_offset = (hashOffset >> 2) + HashTable.data32_cacheIndex;
    var overwrittenData32 = $hashTable.data32[data32_offset];
    $hashTable.data32[data32_offset] = currentIndex;
    $hashTable.hashes8[HashTable.typeOffset(hashOffset)] |= HashTable.isFileCached;

    fileCache.fileStarts[currentIndex] = fileStart;
    fileCache.fileEnds[currentIndex] = fileEnd;
    fileCache.hashOffsets[currentIndex] = hashOffset;
    fileCache.overwrittenData32[currentIndex] = overwrittenData32;

    fileCache.nextIndex++;
    if (fileCache.nextIndex === fileCache.fileStarts.length) {
        fileCache.nextIndex = 0;
    }

    if (fileCache.nextIndex === fileCache.firstIndex) {
        // Avoid overflow
        clearFirstCacheObject(fileCache);
    }
};

FileCache.malloc = function (fileCache, mallocLength) {
    if (fileCache.nextArrayOffset + mallocLength > fileCache.array.length) {
        var minimumCapacity = mallocLength * 8;
        if (minimumCapacity > fileCache.array.length) {
            var capacity = fileCache.array.length;
            while (capacity < minimumCapacity) {
                capacity *= 2;
            }

            var array = new Uint8Array(capacity);
            var i;
            for (i = 0; i < fileCache.nextArrayOffset; i++) {
                array[i] = fileCache.array[i];
            }
            fileCache.array = array;
        } else {
            while (fileCache.firstIndex !== fileCache.nextIndex) {
                if (fileCache.fileStarts[fileCache.firstIndex] >= fileCache.nextArrayOffset) {
                    clearFirstCacheObject(fileCache);
                } else {
                    break;
                }
            }
            fileCache.nextArrayOffset = 0;
        }
    }

    var mallocStart = fileCache.nextArrayOffset;
    var mallocEnd = mallocStart + mallocLength;
    while (fileCache.firstIndex !== fileCache.nextIndex) {
        var firstStart = fileCache.fileStarts[fileCache.firstIndex];
        if (mallocStart <= firstStart && firstStart < mallocEnd) {
            clearFirstCacheObject(fileCache);
        } else {
            break;
        }
    }
};

var clearFirstCacheObject = function (fileCache) {
    var hashOffset = fileCache.hashOffsets[fileCache.firstIndex];
    $hashTable.hashes8[HashTable.typeOffset(hashOffset)] &= ~HashTable.isFileCached;
    var data32_offset = (hashOffset >> 2) + HashTable.data32_cacheIndex;
    $hashTable.data32[data32_offset] = fileCache.overwrittenData32[fileCache.firstIndex];

    fileCache.firstIndex++;
    if (fileCache.firstIndex === fileCache.fileStarts.length) {
        fileCache.firstIndex = 0;
    }
};

})();
