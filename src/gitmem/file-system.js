'use strict';
global.FileSystem = {};
(function () {

// FileSystem.tempHashOffset = Heap.staticAllocate(new Uint8Array(20))[0];

FileSystem.create = function (hashTableN, filesCapacity, random) {
    var heapCapacity = 64 * Math.ceil(hashTableN / 3) + filesCapacity;
    var heap = Heap.create(heapCapacity);
    //var table = HashTable.create(hashTableN, heap, random);
    return {
        heap: heap,
        //hashTable: table,
    };
};

// TODO: This should compact heap (remove old files), and maybe
// resize the hashTable if it is close to needing it.
FileSystem.resizeHeap = function (system, neededExtraCapacity) {
    var capacity = system.heap.capacity;
    var minimumCapacity = capacity + neededExtraCapacity;
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
