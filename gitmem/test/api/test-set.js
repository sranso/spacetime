'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(128);
global.$table = Table.create(16, Random.create(29923321));
global.$mold = Mold.create(4, 128);

var treeLength = Tree.create({
    bar: 'blob',
    foo: 'blob',
    www: 'blob',
});
var moldIndex = Mold.process($mold, treeLength);
var mold32 = Mold.data32_size * moldIndex;
var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
var treeHash = new Uint8Array(20);
Sha1.hash($mold.fileArray, fileStart, fileEnd, treeHash, 0);
log(hexHash(treeHash, 0));
//=> 4f6c3684ecbfbdb53e78302549bae39be9024550

var barHash = new Uint8Array([0x44,0x26,0xd3,0xa5,0xbb,0xf5,0x7d,0x7f,0xae,0xcc,0xe6,0xc5,0x5d,0xd4,0xf9,0xf2,0x57,0x34,0x5b,0x32]);
var fooHash = new Uint8Array([0x20,0xff,0xd3,0xc6,0xdc,0xf3,0x3e,0x56,0x14,0xb8,0x18,0xe3,0x24,0x25,0x4f,0xd5,0x1c,0xc9,0x21,0xf6]);
var wwwHash = new Uint8Array([0x4c,0xa3,0xc5,0xe3,0x51,0x32,0x6f,0xcc,0x06,0x59,0x3d,0x72,0x6c,0xfd,0x0a,0x35,0xe9,0x8d,0x88,0xae]);
var barPointer = ~Table.findPointer($table, barHash, 0);
var fooPointer = ~Table.findPointer($table, fooHash, 0);
var wwwPointer = ~Table.findPointer($table, wwwHash, 0);
var treePointer = ~Table.findPointer($table, treeHash, 0);
Table.setHash($table, barPointer, barHash, 0);
Table.setHash($table, fooPointer, fooHash, 0);
Table.setHash($table, treePointer, wwwHash, 0);
Table.setHash($table, treePointer, treeHash, 0);
var treeDataOffset = treePointer >> 2;
$table.data8[Table.typeOffset(treePointer)] = Type.tree;
$table.data32[treeDataOffset + Table.data32_moldIndex] = moldIndex;

var tree1 = set(treePointer,
                0, barPointer,
                1, fooPointer,
                2, wwwPointer);

var pointer32 = tree1 >> 2;
log(hexHash($table.hashes8, tree1));
//=> e70eb20e74bfacdca9dd49af2aa2e5bc0a2c8597
log($table.data8[Table.typeOffset(tree1)], Type.tree);
//=> 8 8
log($table.data32[pointer32 + 0], barPointer);
//=> 68 68
log($table.data32[pointer32 + 1], fooPointer);
//=> 196 196
log($table.data32[pointer32 + 2], wwwPointer);
//=> 4 4
log($table.data32[pointer32 + Table.data32_moldIndex], moldIndex);
//=> 1 1

var tree2 = set(tree1, 1, wwwPointer);
pointer32 = tree2 >> 2;
log(hexHash($table.hashes8, tree2));
//=> 8c5d6b2c2c278711f5fe6102a9b594d222790566
log($table.data8[Table.typeOffset(tree2)], Type.tree);
//=> 8 8
log($table.data32[pointer32 + 0], barPointer);
//=> 68 68
log($table.data32[pointer32 + 1], wwwPointer);
//=> 4 4
log($table.data32[pointer32 + 2], wwwPointer);
//=> 4 4

var tree3 = set(tree1, 1, wwwPointer);
log(tree3, tree2);
//=> 132 132
