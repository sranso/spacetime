'use strict';
global.FileCache = {};
(function () {

FileCache.create = function (maxNumCached, heapCapacity) {
    return {
        heap: Heap.create(heapCapacity),
        hashOffsets: new Uint32Array(maxNumCached),
        fileStarts: new Uint32Array(maxNumCached),
        nextIndex: 0,
        firstIndex: 0,
    };
};

FileCache.resize = function (cache, mallocSize) {
    var heap = cache.heap;
    var capacity = heap.capacity;
    var minimumCapacity = heap.nextOffset + mallocSize;
    capacity *= 2;
    while (capacity < minimumCapacity) {
        capacity *= 2;
    }

    var oldArray = heap.array;
    var array = new Uint8Array(capacity);
    var i;
    for (i = 0; i < heap.nextOffset; i++) {
        array[i] = oldArray[i];
    }

    heap.array = array;
    heap.capacity = capacity;
};

FileCache.registerCachedFile = function (cache, fileStart, fileEnd, hashOffset) {
    var cacheObject = {
        flags: 0 & ~Objects.isFullObject,
        fileStart: fileStart,
        fileEnd: fileEnd,
        hashOffset: hashOffset,
    };
    $Objects.table[HashTable.objectIndex($HashTable, hashOffset)] = cacheObject;

    var currentIndex = cache.nextIndex;
    cache.fileStarts[currentIndex] = fileStart;
    cache.hashOffsets[currentIndex] = hashOffset;
    cache.nextIndex++;
    if (cache.nextIndex === cache.fileStarts.length) {
        cache.nextIndex = 0;
    }

    while (cache.firstIndex !== currentIndex) {
        var firstStart = cache.fileStarts[cache.firstIndex];
        if (fileStart <= firstStart && firstStart < fileEnd) {
            clearFirstCacheObject(cache);
        } else {
            break;
        }
    }
    if (cache.nextIndex === cache.firstIndex) {
        // Avoid overflow
        clearFirstCacheObject(cache);
    }
};

var clearFirstCacheObject = function (cache) {
    var hashOffset = cache.hashOffsets[cache.firstIndex];
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var cacheObject = $Objects.table[objectIndex];
    if (cacheObject && !(cacheObject.flags & Objects.isFullObject)) {
        $Objects.table[objectIndex] = null;
    }
    cache.firstIndex++;
    if (cache.firstIndex === cache.fileStarts.length) {
        cache.firstIndex = 0;
    }
};

FileCache.maybeRewindNextOffset = function (cache) {
    var heap = cache.heap;
    if (heap.nextOffset + heap.capacity / 8 > heap.capacity) {
        while (cache.firstIndex !== cache.nextIndex) {
            if (cache.fileStarts[cache.firstIndex] >= heap.nextOffset) {
                clearFirstCacheObject(cache);
            } else {
                break;
            }
        }
        heap.nextOffset = 0;
    }
};

})();
