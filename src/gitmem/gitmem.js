'use strict';
global.Gitmem = {};
(function () {

Gitmem.initialize = function () {
    var random = Random.create(Gitmem._randomSeed());
    var bootSystem = GarbageCollector.create(0, 1024, random);
    var bootHeap = bootSystem.heap;
    global.$FileSystem = bootSystem;
    global.$Heap = bootHeap;
    global.$ = bootHeap.array;

    GarbageCollector.initialize();
    Blob.initialize();
    Tree.initialize();

    if (bootHeap.capacity !== 1024 || bootHeap.nextOffset !== bootHeap.capacity) {
        throw new Error('Unexpected boot heap size: ' + bootHeap.nextOffset);
    }
    global.$FileSystem = null;
    global.$Heap = null;
    global.$ = null;
};

Gitmem.create = function () {
    var random = Random.create(Gitmem._randomSeed());

    return {
        random: random,
        table: HashTable.create(random),
    };
};

Gitmem.load = function (gitmem) {
    global.$Random = gitmem.random;
    global.$HashTable = gitmem.table;
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
