'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(32, Random.create(1118295));
global.$mold = Mold.create(32, 2048);

Constants.initialize(-1, 1);
ArrayTree.initialize(4);

log(len(ArrayTree.$zeros[0 + ArrayTree.blobType]));
//=> 0

log(len(ArrayTree.$zeros[1 + ArrayTree.blobType]));
//=> 1

log(len(ArrayTree.$zeros[4 + ArrayTree.treeType]));
//=> 4

var level = 1;
log(len(ArrayTree.$zeros[3 * level + 2 + ArrayTree.treeType]));
//=> 8

level = 3;
log(len(ArrayTree.$zeros[3 * level + 4 + ArrayTree.treeType]));
//=> 256

var array1 = ArrayTree.$zeros[4 + ArrayTree.blobType];
var array2 = ArrayTree.$zeros[2 + ArrayTree.blobType];
level = 1;
var pointer32 = ArrayTree.$zeros[3 * level + 3 + ArrayTree.treeType] >> 2;
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
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
$table.data8[Table.typeOffset(array3)] = Type.tree;
log(len(array3));
//=> 10

level = 2;
var array4 = ArrayTree.$zeros[3 * level + 4 + ArrayTree.treeType];
level = 3;
var pointer32 = ArrayTree.$zeros[3 * level + 2 + ArrayTree.treeType] >> 2;
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
$table.data8[Table.typeOffset(array5)] = Type.tree;
log(len(array5));
//=> 74
