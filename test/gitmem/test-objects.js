'use strict';
require('../helper');

log(Objects.isFullObject);
//=> 1

var objects = Objects.create(4);
log(objects.table.length);
//=> 4
log(objects.table[0], objects.table[3]);
//=> null null
log(objects.unpacked, objects.nextUnpackedIndex);
//=> [] 0
log(objects.packed, objects.nextPackedIndex);
//=> [] 0

// Example usage
objects.unpacked[objects.nextUnpackedIndex] = 'foo';
objects.nextUnpackedIndex++;
log(objects.unpacked, objects.nextUnpackedIndex);
//=> [ 'foo' ] 1

global.$HashTable = {
    hashes: new Uint8Array([0x12,0x34,0x56,0x78,0x90,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x20,0x21,0x22,0x23,0x24,0x25]),
};

var object = {
    flags: 0,
    fileStart: -1,
    fileEnd: -1,
    hashOffset: 0,
    foo: 'bar',
};

// objectIndex would come from HashTable.objectIndex
var objectIndex = 1;
objects.table[objectIndex] = object;

objectIndex = 2
objects.table[3] = object;
log(prettyObjectList(objects.table));
//=> 1: #<123456 foo=bar>
//=> 3: #<123456 foo=bar>

objects.packed[objects.nextPackedIndex] = object;
objects.nextPackedIndex++;
log(objects.nextPackedIndex);
//=> 1
objects.packed[1] = null;
log(prettyObjectList(objects.packed));
//=> 0: #<123456 foo=bar>
