'use strict';
require('../helper');

global.$Heap = Heap.create(256);
global.$ = $Heap.array;
var random = Random.create(283928);
global.$HashTable = HashTable.create(4, $Heap, random);
global.$PackIndex = PackIndex.create(4);

GarbageCollector.resizeHeap(system, 0);
log(system.heap.nextOffset);
//=> 200
log(system.heap.capacity, system.heap.array.length);
//=> 512 512

Convert.stringToExistingArray(system.heap.array, 200, 'foo bar');
system.heap.nextOffset = 203;
GarbageCollector.resizeHeap(system, 1000);
log(system.heap.capacity);
//=> 2048
log(pretty(system.heap.array, 199, 207));
//=> \x00foo\x00\x00\x00\x00
