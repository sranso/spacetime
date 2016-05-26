'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$table = Table.create(4, Random.create(189869));
global.$mold = Mold.create(4, 128);

var treeLength = Tree.create({
    bar: 'blob',
    foo: 'blob',
});
var moldIndex = Mold.process($mold, treeLength);
var treeHash = new Uint8Array(20);
Sha1.hash($file, 0, treeLength, treeHash, 0);
log(hexHash(treeHash, 0));
//=> 6688a3694f23bcc1ef20b2f0ff9f9525e315738b

var treePointer = ~Table.findPointer($table, treeHash, 0);
Table.setHash($table, treePointer, treeHash, 0);
log(hexHash($table.hashes8, treePointer));
//=> 6688a3694f23bcc1ef20b2f0ff9f9525e315738b
var pointer32 = treePointer >> 2;
$table.data32[pointer32 + Table.data32_moldIndex] = moldIndex;
$table.data8[Table.typeOffset(treePointer)] = Type.tree;

log(numChildren(treePointer));
//=> 2
