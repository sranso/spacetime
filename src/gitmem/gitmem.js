'use strict';
global.Gitmem = {};
(function () {

Gitmem.initialize = function () {
    var bootSystem = GarbageCollector.create(0, 1024, random);
    var bootHeap = $Heap.create(1024);
    var random = Random.create(Gitmem._randomSeed());

    global.$Heap = bootHeap;
    global.$ = bootHeap.array;

    GarbageCollector.initialize();
    Blob.initialize();
    Tree.initialize();
    PackIndex.initialize();

    if (bootHeap.capacity !== 1024 || bootHeap.nextOffset !== bootHeap.capacity) {
        throw new Error('Unexpected boot heap size: ' + bootHeap.nextOffset);
    }

    global.$Heap = null;
    global.$ = null;
};

Gitmem.create = function () {
    global.$Random = Random.create(Gitmem._randomSeed());
    global.$Heap = Heap.create(8388608); // 8 MiB
    global.$ = $Heap.array;
    global.$HashTable = HashTable.create(262144, $Random);
    global.$PackIndex = PackIndex.create(262144);
    global.$PackData = PackData.create(8388608);
    global.$FileCache = FileCache.create(8388608);

    GarbageCollector.collect(8388608);

    return {
        random: $Random,
        heap: $Heap,
        hashTable: $HashTable,
        packIndex: $PackIndex,
        packData: $PackData,
        fileCache: $FileCache,
    };
};

Gitmem.load = function (gitmem) {
    global.$Random = gitmem.random;
    global.$Heap = gitmem.heap;
    global.$ = gitmem.heap.array;
    global.$HashTable = gitmem.hashTable;
    global.$PackIndex = gitmem.packIndex;
    global.$PackData = gitmem.packData;
    global.$FileCache = gitmem.fileCache;
};

Gitmem._randomSeed = function () {
    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    var seed = array[0];
    if (seed !== 0) {
        return seed;
    } else {
        return Gitmem._randomSeed();
    }
};

})();
