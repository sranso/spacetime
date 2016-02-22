'use strict';
require('../helper');

var heap = Heap.create(10);
log(heap.nextOffset, heap.capacity, heap.array.length);
//=> 0 10 10

var fileOffset = heap.nextOffset;
var j = fileOffset;
var i;
for (i = 0; i < 6; i++) {
    heap.array[j + i] = 2 * i;
}
var fileLength = i;
heap.nextOffset = j + i;
var file = heap.array.subarray(fileOffset, fileOffset + fileLength);
log(file);
//=> Uint8Array { '0': 0, '1': 2, '2': 4, '3': 6, '4': 8, '5': 10 }

// Example heap resize:
if (heap.capacity - heap.nextOffset < file.length) {
    var newCapacity = heap.capacity * 2;
    var newArray = new Uint8Array(newCapacity);
    for (i = 0; i < heap.nextOffset; i++) {
        newArray[i] = heap.array[i];
    }
    heap.capacity = newCapacity;
    heap.array = newArray;
    log(heap.nextOffset, heap.capacity, heap.array.length);
    //=> 6 20 20
}

j = fileOffset = heap.nextOffset;
for (i = 0; i < file.length; i++) {
    heap.array[j + i] = file[i];
}
fileLength = i;
heap.nextOffset = j + i;

log(heap.nextOffset);
//=> 12
var file2 = heap.array.subarray(fileOffset, fileOffset + fileLength);
log(file2);
//=> Uint8Array { '0': 0, '1': 2, '2': 4, '3': 6, '4': 8, '5': 10 }
