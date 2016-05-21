'use strict';
require('../../test/helper');

var table = Table.create(16, Random.create(42));
log(table.hashes8.length);
//=> 384
log(table.data8.length, table.data32.length);
//=> 384 96
log(table.n);
//=> 16
log(table.hashBitsToShift);
//=> 28

var abc = Convert.stringToArray('abc');
var searchHash = new Uint8Array(20);
Sha1.hash(abc, 0, abc.length, searchHash, 0);
log(hexHash(searchHash, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var pointer = Table.findPointer(table, searchHash, 0);
log(pointer, ~pointer);
//=> -197 196
pointer = ~pointer;

log(Table.typeOffset(pointer));
//=> 193

Table.setHash(table, pointer, searchHash, 0);
log(hexHash(table.hashes8, pointer));
//=> a9993e364706816aba3e25717850c26c9cd0d89d
pointer = Table.findPointer(table, searchHash, 0);
log(pointer);
//=> 196
log(table.load);
//=> 1







// var hashInBlock1 = a9993e364706816aba3e25717850c26c9cd0d89d
var hashInBlock2 = new Uint8Array([0x76,0xd1,0x07,0x98,0x15,0xa1,0xb0,0x42,0x0f,0x2b,0xe8,0x95,0x1f,0x4a,0x98,0x56,0xd3,0xf8,0x67,0x9c]);
var hashInBlock3 = new Uint8Array([0xc2,0x53,0x6d,0xf4,0x3b,0xa3,0x2d,0x99,0x4d,0xe2,0xc5,0xc9,0xbf,0xf8,0x38,0x83,0x12,0xb1,0xb6,0x34]);
var hashInNextBlock1 = new Uint8Array([0xdc,0xd6,0x7d,0x10,0x87,0xe0,0x7b,0x87,0xa5,0x9b,0xb9,0x0a,0x93,0x24,0xa3,0x69,0x47,0x9c,0xcb,0x75]);
var hashInNextBlock2 = new Uint8Array([0x76,0x91,0x69,0x7d,0xeb,0x90,0x63,0xb4,0xf2,0x35,0xe7,0xac,0x1c,0x6e,0x6b,0x5d,0x81,0x23,0x8f,0xad]);
var hashInNextBlock3 = new Uint8Array([0x3e,0x7c,0x4b,0x99,0xe9,0xb4,0xe1,0x68,0x06,0xea,0x4b,0x96,0xcc,0x64,0x8b,0x46,0xff,0xd8,0x24,0xd7]);
var hashInLastBlock1 = new Uint8Array([0xf8,0xad,0x8a,0x6d,0xc7,0xb1,0x31,0xf9,0x5c,0x38,0xc4,0x1e,0x79,0x3d,0x2b,0x70,0x0f,0xb7,0x07,0x51]);

// hashInBlock1
log(pointer);
//=> 196
pointer = ~Table.findPointer(table, hashInBlock2, 0);
log(pointer);
//=> 216
Table.setHash(table, pointer, hashInBlock2, 0);
pointer = ~Table.findPointer(table, hashInBlock3, 0);
log(pointer);
//=> 236
Table.setHash(table, pointer, hashInBlock3, 0);
pointer = ~Table.findPointer(table, hashInNextBlock1, 0);
log(pointer);
//=> 4
Table.setHash(table, pointer, hashInNextBlock1, 0);
pointer = ~Table.findPointer(table, hashInNextBlock2, 0);
log(pointer);
//=> 24
Table.setHash(table, pointer, hashInNextBlock2, 0);
pointer = ~Table.findPointer(table, hashInNextBlock3, 0);
log(pointer);
//=> 44
Table.setHash(table, pointer, hashInNextBlock3, 0);
pointer = ~Table.findPointer(table, hashInLastBlock1, 0);
log(pointer);
//=> 68
Table.setHash(table, pointer, hashInLastBlock1, 0);
