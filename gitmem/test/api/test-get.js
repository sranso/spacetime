'use strict';
require('../../../test/helper');

global.$table = Table.create(4, Random.create(189869));
global.$file = new Uint8Array(128);
global.$mold = Mold.create(4, 128);

var treeLength = Tree.create({
    bar: 'blob',
    foo: 'blob',
});
var moldIndex = Mold.process($mold, treeLength);
var data32_index = Mold.data32_size * moldIndex;
var fileStart = $mold.data32[data32_index + Mold.data32_fileStart];
var fileEnd = $mold.data32[data32_index + Mold.data32_fileEnd];
var holeOffsets = Mold.data8_size * moldIndex + Mold.data8_holeOffsets;
var barHash = new Uint8Array([0x44,0x26,0xd3,0xa5,0xbb,0xf5,0x7d,0x7f,0xae,0xcc,0xe6,0xc5,0x5d,0xd4,0xf9,0xf2,0x57,0x34,0x5b,0x32]);
var fooHash = new Uint8Array([0x20,0xff,0xd3,0xc6,0xdc,0xf3,0x3e,0x56,0x14,0xb8,0x18,0xe3,0x24,0x25,0x4f,0xd5,0x1c,0xc9,0x21,0xf6]);
Tree.setHash($mold.fileArray, fileStart + $mold.data8[holeOffsets + 0], fooHash, 0);
Tree.setHash($mold.fileArray, fileStart + $mold.data8[holeOffsets + 1], barHash, 0);
var treeHash = new Uint8Array(20);
Sha1.hash($mold.fileArray, fileStart, fileEnd, treeHash, 0);
log(hexHash(treeHash, 0));
//=> d5bec1220e8ac3041ad459339d079abc7c21133c

var barPointer = ~Table.findPointer($table, barHash, 0);
var fooPointer = ~Table.findPointer($table, fooHash, 0);
var treePointer = ~Table.findPointer($table, treeHash, 0);
Table.setHash($table, barPointer, barHash, 0);
Table.setHash($table, fooPointer, fooHash, 0);
Table.setHash($table, treePointer, treeHash, 0);
log(hexHash($table.hashes8, treePointer));
//=> d5bec1220e8ac3041ad459339d079abc7c21133c
var pointer32 = treePointer >> 2;
$table.data32[pointer32 + 0] = barPointer;
$table.data32[pointer32 + 1] = fooPointer;
$table.data32[pointer32 + Table.data32_moldIndex] = moldIndex;
$table.data8[Table.typeOffset(treePointer)] = Type.tree;

log(get(treePointer, 0), barPointer);
//=> 68 68
log(get(treePointer, 1), fooPointer);
//=> 4 4
log(get(treePointer, 2));
//=> 0
