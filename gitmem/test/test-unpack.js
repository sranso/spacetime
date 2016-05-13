'use strict';
require('../../test/helper');

global.$table = Table.create(4, Random.create(526926));
global.$file = new Uint8Array(128);
global.$mold = Mold.create(32, 128);

var inputPackData = PackData.create(160);
inputPackData.array[11] = 3;  // Number of packed files.
inputPackData.nextOffset = 12;

var fooLength = Blob.create('foo', []);
var fooHash = new Uint8Array(20);
Sha1.hash($file, 0, fooLength, fooHash, 0);
log(hexHash(fooHash, 0));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c
PackData.packFile(inputPackData, $file, 0, fooLength);

var barLength = Blob.create('bar', []);
var barHash = new Uint8Array(20);
Sha1.hash($file, 0, barLength, barHash, 0);
log(hexHash(barHash, 0));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116
PackData.packFile(inputPackData, $file, 0, barLength);

var treeLength = Tree.create({
    foo: 'blob',
    bar: 'blob',
    missing: 'tree',
});
var missingHash = new Uint8Array([0x1d,0xbf,0xb8,0xa3,0x73,0x21,0x96,0x64,0xf5,0xae,0xd3,0xa6,0x72,0xac,0xf4,0xbf,0x39,0xc8,0xfb,0x52]);
var barOffset = $file.indexOf(0, 12) + 1;
var fooOffset = $file.indexOf(0, barOffset + 20) + 1;
var missingOffset = $file.indexOf(0, fooOffset + 20) + 1;
Tree.setHash($file, barOffset, barHash, 0);
Tree.setHash($file, fooOffset, fooHash, 0);
Tree.setHash($file, missingOffset, missingHash, 0);
log(pretty($file, 0, treeLength));
//=> tree 96\x00100644 bar\x00\xba\x0e\x16.\x1cGF\x9e?\xe4\xb3\x93\xa8\xbf\x8cV\x9f0\x21\x16100644 foo\x00\x19\x10\x28\x15f=\x23\xf8\xb7ZG\xe7\xa0\x19e\xdc\xdc\x96F\x8c40000 missing\x00\x1d\xbf\xb8\xa3s\x21\x96d\xf5\xae\xd3\xa6r\xac\xf4\xbf9\xc8\xfbR
var treeHash = new Uint8Array(20);
Sha1.hash($file, 0, treeLength, treeHash, 0);
log(hexHash(treeHash, 0));
//=> df16029e64d49b34861f2c31f6f7cd9fa252a24d
PackData.packFile(inputPackData, $file, 0, treeLength);


var inputPackPointer = inputPackData.nextOffset;
log(inputPackData.nextOffset);
//=> 140
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackPointer, inputPack, inputPackPointer);
log(hexHash(inputPack, inputPackPointer));
//=> 2b2ead7e8ab2a99c6b65469323667ed7b48b3ca2








global.$packData = PackData.create(512);
$packData.nextOffset = 123;

Unpack.unpack(inputPack);

// foo
var pointer = Table.findPointer($table, fooHash, 0);
var fooPointer = pointer;
log(pointer, hexHash($table.hashes8, pointer));
//=> 4 '19102815663d23f8b75a47e7a01965dcdc96468c'
var type = $table.data8[Table.typeOffset(pointer)];
log(type, Type.blob);
//=> 4 4
var pointer32 = pointer >> 2;
var packOffset = $table.data32[pointer32 + Table.data32_packOffset];
log(packOffset);
//=> 123
var extractFileOutput = [];
PackData.extractFile($packData.array, packOffset, extractFileOutput);
var fileLength = extractFileOutput[0];
var nextPackOffset = extractFileOutput[1];
log(fileLength, nextPackOffset);
//=> 10 135
log(pretty($file, 0, fileLength));
//=> blob 3\x00foo


// bar
pointer = Table.findPointer($table, barHash, 0);
var barPointer = pointer;
log(pointer);
//=> 68
log(hexHash($table.hashes8, pointer));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116
type = $table.data8[Table.typeOffset(pointer)];
log(type, Type.blob);
//=> 4 4
pointer32 = pointer >> 2;
packOffset = $table.data32[pointer32 + Table.data32_packOffset];
log(packOffset);
//=> 135
extractFileOutput = [];
PackData.extractFile($packData.array, packOffset, extractFileOutput);
fileLength = extractFileOutput[0];
nextPackOffset = extractFileOutput[1];
log(fileLength, nextPackOffset);
//=> 10 147
log(pretty($file, 0, fileLength));
//=> blob 3\x00bar


// tree
pointer = Table.findPointer($table, treeHash, 0);
log(pointer);
//=> 24
log(hexHash($table.hashes8, pointer));
//=> df16029e64d49b34861f2c31f6f7cd9fa252a24d
type = $table.data8[Table.typeOffset(pointer)];
log(type, Type.tree);
//=> 8 8
pointer32 = pointer >> 2;
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
log(moldIndex);
//=> 1
var mold32 = Mold.data32_size * moldIndex;
var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
log(pretty($mold.fileArray, fileStart, fileEnd));
//=> tree 96\x00100644 bar\x00\xba\x0e\x16.\x1cGF\x9e?\xe4\xb3\x93\xa8\xbf\x8cV\x9f0\x21\x16100644 foo\x00\x19\x10\x28\x15f=\x23\xf8\xb7ZG\xe7\xa0\x19e\xdc\xdc\x96F\x8c40000 missing\x00\x1d\xbf\xb8\xa3s\x21\x96d\xf5\xae\xd3\xa6r\xac\xf4\xbf9\xc8\xfbR
var mold8 = Mold.data8_size * moldIndex;
var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];
log(numChildren);
//=> 3
var childPointer = $table.data32[pointer32 + 0];
log(childPointer, barPointer);
//=> 68 68
childPointer = $table.data32[pointer32 + 1];
log(childPointer, fooPointer);
//=> 4 4
var missingPointer = Table.findPointer($table, missingHash, 0);
childPointer = $table.data32[pointer32 + 2];
log(childPointer, missingPointer);
//=> 44 44
type = $table.data8[Table.typeOffset(missingPointer)];
log(type, Type.pending);
//=> 1 1
