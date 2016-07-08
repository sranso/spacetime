'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(64, Random.create(1118295));
global.$mold = Mold.create(32, 2048);

Constants.initialize(-1, 1);
ArrayTree.initialize(4);

var num0 = Constants.$positive[0];
var array0 = ArrayTree.$zeros[0];
var array1 = push(array0, num0);
log(len(array1));
//=> 1
log(array1 === ArrayTree.$zeros[1 + ArrayTree.blobType]);
//=> true

var array4 = push(push(push(array1, num0), num0), num0);
log(len(array4));
//=> 4
log(array4 === ArrayTree.$zeros[4 + ArrayTree.blobType]);
//=> true

var emptyTree = $[Constants.emptyTree];
var treeArray2 = push(push(array0, emptyTree), emptyTree);
log(len(treeArray2));
//=> 2
log(treeArray2 === ArrayTree.$zeros[2 + ArrayTree.treeType]);
//=> true

var array5 = push(array4, num0);
log(len(array5));
//=> 5
var pointer32 = array5 >> 2;
log($table.data8[Table.typeOffset(array5)], Type.tree);
//=> 9 9
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 1 1
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 2
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 1
log($table.data32[pointer32 + 0] === array4);
//=> true
log($table.data32[pointer32 + 1] === array1);
//=> true

var array6 = push(array5, num0);
log(len(array6));
//=> 6
var pointer32 = array6 >> 2;
log($table.data8[Table.typeOffset(array6)], Type.tree);
//=> 9 9
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 1 1
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 2
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 1
log($table.data32[pointer32 + 0] === array4);
//=> true
log($table.data32[pointer32 + 1] === ArrayTree.$zeros[2 + ArrayTree.blobType]);
//=> true

var array9 = push(push(push(array6, num0), num0), num0);
log(len(array9));
//=> 9
var pointer32 = array9 >> 2;
log($table.data8[Table.typeOffset(array9)], Type.tree);
//=> 9 9
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 1 1
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 3
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 1
log($table.data32[pointer32 + 0] === array4);
//=> true
log($table.data32[pointer32 + 1] === array4);
//=> true
log($table.data32[pointer32 + 2] === array1);
//=> true

var array = array9;
var i;
for (i = 9; i < 16; i++) {
    array = push(array, num0);
}

var array16 = array;
log(len(array16));
//=> 16
var level = 1;
log(array16 === ArrayTree.$zeros[3 * level + 4 + ArrayTree.treeType]);
//=> true

var array17 = push(array16, num0);
log(len(array17));
//=> 17
var pointer32 = array17 >> 2;
log($table.data8[Table.typeOffset(array17)], Type.tree);
//=> 9 9
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 1 1
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 2
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 2
log($table.data32[pointer32 + 0] === array16);
//=> true
log($table.data32[pointer32 + 1] === array1);
//=> true

var array = array17;
var i;
for (i = 17; i < 21; i++) {
    array = push(array, num0);
}

var array21 = array;
log(len(array21));
//=> 21
var pointer32 = array21 >> 2;
log($table.data8[Table.typeOffset(array21)], Type.tree);
//=> 9 9
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 1 1
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 2
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 2
log($table.data32[pointer32 + 0] === array16);
//=> true
log($table.data32[pointer32 + 1] === array5);
//=> true

var array = array21;
var i;
for (i = 21; i < 33; i++) {
    array = push(array, num0);
}

var array33 = array;
log(len(array33));
//=> 33
var pointer32 = array33 >> 2;
log($table.data8[Table.typeOffset(array33)], Type.tree);
//=> 9 9
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 1 1
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 3
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 2
log($table.data32[pointer32 + 0] === array16);
//=> true
log($table.data32[pointer32 + 1] === array16);
//=> true
log($table.data32[pointer32 + 2] === array1);
//=> true
