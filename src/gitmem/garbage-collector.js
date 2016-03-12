'use strict';
global.GarbageCollector = {};
(function () {

GarbageCollector.bootSystem = null;
GarbageCollector.tempHashOffset = -1;

GarbageCollector.initialize = function () {
    GarbageCollector.bootSystem = $GarbageCollector;

    var offset64 = 64 * Math.ceil($Heap.nextOffset / 64);
    GarbageCollector.tempHashOffset = offset64;
    $Heap.nextOffset = offset64 + 64;
};

GarbageCollector.create = function (hashTableN, filesCapacity, random) {
    var heapCapacity = 64 * Math.ceil(hashTableN / 3) + filesCapacity;
    var heap = Heap.create(heapCapacity);
    var table = HashTable.create(hashTableN, heap, random);
    return {
        heap: heap,
        hashTable: table,
    };
};

// TODO: This should compact heap (remove old files), and maybe
// resize the hashTable if it is close to needing it.
GarbageCollector.resizeHeap = function (system, mallocSize) {
    var capacity = system.heap.capacity;
    var minimumCapacity = system.heap.nextOffset + mallocSize;
    capacity *= 2;
    while (capacity < minimumCapacity) {
        capacity *= 2;
    }

    var oldArray = system.heap.array;
    var array = new Uint8Array(capacity);
    var i;
    for (i = 0; i < system.heap.nextOffset; i++) {
        array[i] = oldArray[i];
    }

    system.heap.array = array;
    system.heap.capacity = capacity;
};

})();
