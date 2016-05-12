'use strict';
require('../../test/helper');

global.$file = new Uint8Array(128);

var mold = Mold.create(4, 256);
log(mold.table.length);
//=> 16
log(mold.data32.length);
//=> 16
log(mold.nextIndex);
//=> 1
log(mold.fileArray.length);
//=> 256
log(mold.nextArrayOffset);
//=> 0

var treeLength = Tree.create({
    foo: 'blob',
    bar: 'tree',
});

var moldIndex = Mold.process(mold, treeLength);
log(moldIndex, mold.nextIndex);
//=> 1 2
var data32_index = Mold.data32_size * moldIndex;
var fileStart = mold.data32[data32_index + Mold.data32_fileStart];
var fileEnd = mold.data32[data32_index + Mold.data32_fileEnd];
log(fileStart, fileEnd);
//=> 0 69
log(pretty(mold.fileArray, fileStart, fileEnd));
//=> tree 61\x0040000 bar\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00100644 foo\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00

var data8_index = Mold.data8_size * moldIndex;
var numHoles = mold.data8[data8_index + Mold.data8_numHoles];
log(numHoles);
//=> 2
log(mold.data8[data8_index + Mold.data8_holeOffsets + 0]);
//=> 18
log(mold.data8[data8_index + Mold.data8_holeOffsets + 1]);
//=> 49

log(mold.table[2], mold.table[3]);
//=> 1 883828478



moldIndex = Mold.process(mold, treeLength);
log(moldIndex);
//=> 1

treeLength = Tree.create({
    notTheSame: 'blob',
    properties: 'tree',
}, []);
moldIndex = Mold.process(mold, treeLength);
log(moldIndex);
//=> 2
