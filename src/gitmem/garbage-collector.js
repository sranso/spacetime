'use strict';
global.GarbageCollector = {};
(function () {

var bootHeap;
var bootHashTable;

GarbageCollector.initialize = function () {
    bootHeap = $Heap;
    bootHashTable = $HashTable;
};

GarbageCollector.collect = function (mallocSize) {
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
