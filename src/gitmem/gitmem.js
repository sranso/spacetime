'use strict';
global.Gitmem = {};
(function () {

Gitmem.initialize = function () {
    var bootHeap = Heap.create(1024);
    var random = Random.create(Gitmem._randomSeed());

    global.$heap = bootHeap;
    global.$ = bootHeap.array;

    Blob.initialize();
    Tree.initialize();
    PackIndex.initialize();

    if (bootHeap.capacity !== 1024 || bootHeap.nextOffset !== bootHeap.capacity) {
        throw new Error('Unexpected boot heap size: ' + bootHeap.nextOffset);
    }

    global.$heap = null;
    global.$ = null;
};

Gitmem.create = function () {
    global.$random = Random.create(Gitmem._randomSeed());
    global.$heap = Heap.create(8388608); // 8 MiB
    global.$ = $heap.array;
    global.$hashTable = HashTable.create(262144, $random);
    global.$packData = PackData.create(8388608);
    global.$fileCache = FileCache.create(8388608);

    return {
        random: $random,
        heap: $heap,
        hashTable: $hashTable,
        packData: $packData,
        fileCache: $fileCache,
    };
};

Gitmem.load = function (gitmem) {
    global.$random = gitmem.random;
    global.$heap = gitmem.heap;
    global.$ = gitmem.heap.array;
    global.$hashTable = gitmem.hashTable;
    global.$packData = gitmem.packData;
    global.$fileCache = gitmem.fileCache;
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
