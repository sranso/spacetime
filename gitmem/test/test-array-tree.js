'use strict';
require('../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(64, Random.create(625772001));
global.$mold = Mold.create(64, 2048);

Constants.initialize(-1, 1);
var levels = 4;
ArrayTree.initialize(levels);

log(ArrayTree.$zeros.length);
//=> 28
log(ArrayTree.$zeros.length, 6 * levels + 4);
//=> 28 28

var prettyMold = function (moldIndex) {
    var mold32 = moldIndex * Mold.data32_size;
    var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
    var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
    return pretty($mold.fileArray, fileStart, fileEnd);
};

// For reference
log(hexHash($table.hashes8, Constants.$positive[0]));
//=> c227083464fb9af8955c90d2924774ee50abb547
log(hexHash($table.hashes8, $[Constants.emptyTree]));
//=> eb3c1ec5e288babdc43edd0205033f2a14bb4c1b

// Empty blob/tree
var pointer = ArrayTree.$zeros[0];
var pointer32 = pointer >> 2;
log($table.data8[Table.typeOffset(pointer)], Type.arrayTree);
//=> 9 9
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 9 9
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 0
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 0
log(prettyMold(moldIndex));
//=> tree 43\x00100644 .empty-array:L0\x00\x9dh\x93<D\xf19\x85\xb9\xeb\x19\x15\x9d\xa6\xeb?\xf0\xe5t\xbf

// blob 1:L0
pointer = ArrayTree.$zeros[2 * 2 + ArrayTree.blobType];
pointer32 = pointer >> 2;
log($table.data8[Table.typeOffset(pointer)], Type.arrayTree);
//=> 9 9
moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 9 9
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 2
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 0
log(prettyMold(moldIndex));
//=> tree 61\x00100644 0:L0\x00\xc2\x27\x084d\xfb\x9a\xf8\x95\\x90\xd2\x92Gt\xeeP\xab\xb5G100644 1\x00\xc2\x27\x084d\xfb\x9a\xf8\x95\\x90\xd2\x92Gt\xeeP\xab\xb5G

// blob/tree 3:L3
var level = 3;
pointer = ArrayTree.$zeros[6 * level + 2 * 4];
pointer32 = pointer >> 2;
log($table.data8[Table.typeOffset(pointer)], Type.arrayTree);
//=> 9 9
moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 9 9
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 4
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 3
log(prettyMold(moldIndex));
//=> tree 115\x0040000 0:L3\x00\x87\xd1Y\xf5\x90rd\xd6\x8e\xd6G\xcc\x27\x9b\x1c\x13\x8d\x96C740000 1\x00\x87\xd1Y\xf5\x90rd\xd6\x8e\xd6G\xcc\x27\x9b\x1c\x13\x8d\x96C740000 2\x00\x87\xd1Y\xf5\x90rd\xd6\x8e\xd6G\xcc\x27\x9b\x1c\x13\x8d\x96C740000 3\x00\x87\xd1Y\xf5\x90rd\xd6\x8e\xd6G\xcc\x27\x9b\x1c\x13\x8d\x96C7

// tree 2:L0
pointer = ArrayTree.$zeros[2 * 3 + ArrayTree.treeType];
pointer32 = pointer >> 2;
log($table.data8[Table.typeOffset(pointer)], Type.arrayTree);
//=> 9 9
moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
mold8 = moldIndex * Mold.data8_size;
log($mold.data8[mold8 + Mold.data8_treeType], Type.arrayTree);
//=> 9 9
log($mold.data8[mold8 + Mold.data8_numChildren]);
//=> 3
log($mold.data8[mold8 + Mold.data8_arrayTreeLevel]);
//=> 0
log(prettyMold(moldIndex));
//=> tree 87\x0040000 0:L1\x00\xeb<\x1e\xc5\xe2\x88\xba\xbd\xc4>\xdd\x02\x05\x03?\x2a\x14\xbbL\x1b40000 1\x00\xeb<\x1e\xc5\xe2\x88\xba\xbd\xc4>\xdd\x02\x05\x03?\x2a\x14\xbbL\x1b40000 2\x00\xeb<\x1e\xc5\xe2\x88\xba\xbd\xc4>\xdd\x02\x05\x03?\x2a\x14\xbbL\x1b
