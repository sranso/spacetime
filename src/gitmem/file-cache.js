'use strict';
global.FileCache = {};
(function () {

FileCache.hasOverwrittenData32 = 1 << 2;

FileCache.create = function (maxNumCached, arrayCapacity) {
    return {
        array: new Uint8Array(arrayCapacity),
        fileRanges: new Uint32Array(2 * maxNumCached),
        hashOffsets: new Uint32Array(maxNumCached),
        overwrittenData32: new Uint32Array(maxNumCached),
        flags: new Uint8Array(maxNumCached),
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

    var doubleIndex = currentIndex * 2;
    fileCache.fileRanges[doubleIndex] = fileStart;
    fileCache.fileRanges[doubleIndex + 1] = fileEnd;
    fileCache.hashOffsets[currentIndex] = hashOffset;

    var flags = 0;
    if (overwrittenData32) {
        flags |= FileCache.hasOverwrittenData32;
        fileCache.overwrittenData32[currentIndex] = overwrittenData32;
    }
    fileCache.flags[currentIndex] = flags;

    fileCache.nextIndex++;
    if (fileCache.nextIndex === fileCache.hashOffsets.length) {
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
                var fileStart = fileCache.fileRanges[2 * fileCache.firstIndex];
                if (fileStart >= fileCache.nextArrayOffset) {
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
        var firstStart = fileCache.fileRanges[2 * fileCache.firstIndex];
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
    var flags = fileCache.flags[fileCache.firstIndex];
    var overwrittenData32 = 0;
    if (flags & FileCache.hasOverwrittenData32) {
        overwrittenData32 = fileCache.overwrittenData32[fileCache.firstIndex];
    }
    $hashTable.data32[data32_offset] = overwrittenData32;

    fileCache.firstIndex++;
    if (fileCache.firstIndex === fileCache.hashOffsets.length) {
        fileCache.firstIndex = 0;
    }
};

})();
