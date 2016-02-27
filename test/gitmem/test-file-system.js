'use strict';
require('../helper');

var random = Random.create(283928);
var system = FileSystem.create(0, 100, random);
log(system.heap.capacity, system.heap.array.length);
//=> 100 100

system = FileSystem.create(6, 128, random);
log(system.heap.capacity);
//=> 256

system.heap.nextOffset = 200;

FileSystem.resizeHeap(system, 0);
log(system.heap.nextOffset);
//=> 200
log(system.heap.capacity, system.heap.array.length);
//=> 512 512

GitConvert.stringToHeap(system.heap, 'foo bar');
system.heap.nextOffset = 203;
FileSystem.resizeHeap(system, 600);
log(system.heap.capacity);
//=> 2048
log(pretty(system.heap.array.subarray(199, 207)));
//=> \x00foo\x00\x00\x00\x00
