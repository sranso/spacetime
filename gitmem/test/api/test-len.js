'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(32, Random.create(1118295));
global.$mold = Mold.create(32, 2048);

Constants.initialize(-1, 1);
ArrayTree.initialize(4);

log(len(ArrayTree.zeroFor(0, 0, ArrayTree.blobType)));
//=> 0

log(len(ArrayTree.zeroFor(0, 1, ArrayTree.blobType)));
//=> 1

log(len(ArrayTree.zeroFor(0, 4, ArrayTree.treeType)));
//=> 4

log(len(ArrayTree.zeroFor(1, 2, ArrayTree.blobType)));
//=> 8

log(len(ArrayTree.zeroFor(2, 4, ArrayTree.treeType)));
//=> 64

var array1 = ArrayTree.zeroFor(0, 4, ArrayTree.blobType);
var array2 = ArrayTree.zeroFor(0, 2, ArrayTree.blobType);
var pointer32 = ArrayTree.zeroFor(1, 3, ArrayTree.blobType) >> 2;
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
log(moldIndex);
//=> 8
var data32 = new Uint32Array([array1, array1, array2]);
Mold.fillHoles($mold, moldIndex, data32, 0);
var mold32 = moldIndex * Mold.data32_size;
var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
var arrayHash = new Uint8Array(20);
Sha1.hash($mold.fileArray, fileStart, fileEnd, arrayHash, 0);
var array3 = ~Table.findPointer($table, arrayHash, 0);
Table.setHash($table, arrayHash, 0);
var pointer32 = array3 >> 2;
$table.data32[pointer32 + 0] = array1;
$table.data32[pointer32 + 1] = array1;
$table.data32[pointer32 + 2] = array2;
$table.data32[pointer32 + Table.data32_moldIndex] = moldIndex;
$table.data8[Table.typeOffset(array3)] = Type.arrayTree;
log(len(array3));
//=> 10

var array4 = ArrayTree.zeroFor(2, 4, ArrayTree.treeType);
var pointer32 = ArrayTree.zeroFor(3, 2, ArrayTree.treeType) >> 2;
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var data32 = new Uint32Array([array4, array3]);
Mold.fillHoles($mold, moldIndex, data32, 0);
var mold32 = moldIndex * Mold.data32_size;
var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
var arrayHash = new Uint8Array(20);
Sha1.hash($mold.fileArray, fileStart, fileEnd, arrayHash, 0);
var array5 = ~Table.findPointer($table, arrayHash, 0);
Table.setHash($table, arrayHash, 0);
var pointer32 = array5 >> 2;
$table.data32[pointer32 + 0] = array4;
$table.data32[pointer32 + 1] = array3;
$table.data32[pointer32 + Table.data32_moldIndex] = moldIndex;
$table.data8[Table.typeOffset(array5)] = Type.arrayTree;
log(len(array5));
//=> 74
