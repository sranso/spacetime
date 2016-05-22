'use strict';
require('../../test/helper');

global.$file = new Uint8Array(128);
global.$table = Table.create(4, Random.create(281759));

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
    bar: 'blob',
});

var moldIndex = Mold.process(mold, treeLength);
log(moldIndex, mold.nextIndex);
//=> 1 2
var mold32 = Mold.data32_size * moldIndex;
var fileStart = mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = mold.data32[mold32 + Mold.data32_fileEnd];
log(fileStart, fileEnd);
//=> 0 70
log(pretty(mold.fileArray, fileStart, fileEnd));
//=> tree 62\x00100644 bar\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00100644 foo\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00

var mold8 = Mold.data8_size * moldIndex;
var numHoles = mold.data8[mold8 + Mold.data8_numHoles];
log(numHoles);
//=> 2
var holeOffset = mold.data8[mold8 + Mold.data8_holeOffsets + 0];
log(holeOffset);
//=> 19
log(mold.data8[mold8 + Mold.data8_holeOffsets + 1]);
//=> 50

log(mold.table[8], mold.table[9]);
//=> 1 4263938646



mold.fileArray[fileStart + holeOffset] = 123;
moldIndex = Mold.process(mold, treeLength);
log(moldIndex);
//=> 1

treeLength = Tree.create({
    notTheSame: 'blob',
    properties: 'tree',
}, []);
var differentMoldIndex = Mold.process(mold, treeLength);
log(differentMoldIndex);
//=> 2



var bar = hash('bar');
var foo = hash('foo');
log(hexHash($table.hashes8, bar));
//=> b5a955a315ea15b15e2fc13012b963e1ad360a2f
log(hexHash($table.hashes8, foo));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82
var data32 = new Uint32Array([bar, foo]);
Mold.fillHoles(mold, moldIndex, data32, 0);
log(pretty(mold.fileArray, fileStart, fileEnd));
//=> tree 62\x00100644 bar\x00\xb5\xa9U\xa3\x15\xea\x15\xb1^/\xc10\x12\xb9c\xe1\xad6
//=> /100644 foo\x00\xd4Wr\xe3\xc5[iR5\xfa\x26ovh\xbb\x8a\xdf\xb6]\x82
