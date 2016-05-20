'use strict';
require('../../test/helper');

global.$table = Table.create(8, Random.create(526926));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(4, 256);

var inputPackData = PackData.create(268);
inputPackData.array[11] = 5;  // Number of packed files.
inputPackData.nextOffset = 12;

var messageLength = Blob.create('"I <3 short messages');
var messageHash = new Uint8Array(20);
Sha1.hash($file, 0, messageLength, messageHash, 0);
log(hexHash(messageHash, 0));
//=> 4bcaa335392f4f0fb35fda58017d41fa07ddeb8b
PackData.packFile(inputPackData, $file, 0, messageLength);

var longMessageLength = Blob.create('"I am a long message!');
var longMessageHash = new Uint8Array(20);
Sha1.hash($file, 0, longMessageLength, longMessageHash, 0);
log(hexHash(longMessageHash, 0));
//=> 1bdef86a177d4feccf0a534ee7257255ba89e8ec
PackData.packFile(inputPackData, $file, 0, longMessageLength);

var answerLength = Blob.create('42');
var answerHash = new Uint8Array(20);
Sha1.hash($file, 0, answerLength, answerHash, 0);
log(hexHash(answerHash, 0));
//=> f70d7bba4ae1f07682e0358bd7a2068094fc023b
PackData.packFile(inputPackData, $file, 0, answerLength);

var piLength = Blob.create('3.141592653589793');
var piHash = new Uint8Array(20);
Sha1.hash($file, 0, piLength, piHash, 0);
log(hexHash(piHash, 0));
//=> e5c1cebcacfc81cf51a61c031e716d874981360e
PackData.packFile(inputPackData, $file, 0, piLength);

var treeLength = Tree.create({
    answer: 'blob',
    message: 'blob',
    missing: 'tree',
    pi: 'blob',
});
var missingHash = new Uint8Array([0x1d,0xbf,0xb8,0xa3,0x73,0x21,0x96,0x64,0xf5,0xae,0xd3,0xa6,0x72,0xac,0xf4,0xbf,0x39,0xc8,0xfb,0x52]);
var answerOffset = $file.indexOf(0, 12) + 1;
var messageOffset = $file.indexOf(0, answerOffset + 20) + 1;
var missingOffset = $file.indexOf(0, messageOffset + 20) + 1;
var piOffset = $file.indexOf(0, missingOffset + 20) + 1;
Tree.setHash($file, answerOffset, answerHash, 0);
Tree.setHash($file, messageOffset, messageHash, 0);
Tree.setHash($file, missingOffset, missingHash, 0);
Tree.setHash($file, piOffset, piHash, 0);
log(pretty($file, 0, treeLength));
//=> tree 133\x00100644 answer\x00\xf7\x0d\x7b\xbaJ\xe1\xf0v\x82\xe05\x8b\xd7\xa2\x06\x80\x94\xfc\x02;100644 message\x00K\xca\xa359/O\x0f\xb3_\xdaX\x01\x7dA\xfa\x07\xdd\xeb\x8b40000 missing\x00\x1d\xbf\xb8\xa3s\x21\x96d\xf5\xae\xd3\xa6r\xac\xf4\xbf9\xc8\xfbR100644 pi\x00\xe5\xc1\xce\xbc\xac\xfc\x81\xcfQ\xa6\x1c\x03\x1eqm\x87I\x816\x0e
var treeHash = new Uint8Array(20);
Sha1.hash($file, 0, treeLength, treeHash, 0);
log(hexHash(treeHash, 0));
//=> e92993fcf3ac79777e33c872279a15956a3df4d9
PackData.packFile(inputPackData, $file, 0, treeLength);

var inputPackHashOffset = inputPackData.nextOffset;
log(inputPackData.nextOffset);
//=> 248
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackHashOffset, inputPack, inputPackHashOffset);
log(hexHash(inputPack, inputPackHashOffset));
//=> 020dbb4f7410b166c2db39be9779a7bc76184c5a







Unpack.unpack(inputPack);

// message
var message = Table.findPointer($table, messageHash, 0);
log(message, hexHash($table.hashes8, message));
//=> 4 '4bcaa335392f4f0fb35fda58017d41fa07ddeb8b'
log($table.data8[Table.typeOffset(message)], Type.string);
//=> 4 4
log($table.data8[message + Table.data8_stringLength]);
//=> 19
log($table.data8[message + 0], 'I'.charCodeAt(0));
//=> 73 73
log($table.data8[message + 1], ' '.charCodeAt(0));
//=> 32 32
log($table.data8[message + 18], 's'.charCodeAt(0));
//=> 115 115


// longMessage
var longMessage = Table.findPointer($table, longMessageHash, 0);
log(longMessage, hexHash($table.hashes8, longMessage));
//=> 68 '1bdef86a177d4feccf0a534ee7257255ba89e8ec'
log($table.data8[Table.typeOffset(longMessage)], Type.longString);
//=> 5 5
var longStringI = $table.data32[(longMessage >> 2) + 0];
log(longStringI);
//=> 0
log($table.dataLongStrings[longStringI]);
//=> I am a long message!


// answer
var answer = Table.findPointer($table, answerHash, 0);
var answerPointer = answer;
log(answer, hexHash($table.hashes8, answer));
//=> 24 'f70d7bba4ae1f07682e0358bd7a2068094fc023b'
log($table.data8[Table.typeOffset(answer)], Type.integer);
//=> 6 6
log($table.dataInt32[(answer >> 2) + 0]);
//=> 42


// pi
var pi = Table.findPointer($table, piHash, 0);
var piPointer = pi;
log(pi, hexHash($table.hashes8, pi));
//=> 44 'e5c1cebcacfc81cf51a61c031e716d874981360e'
log($table.data8[Table.typeOffset(pi)], Type.float);
//=> 7 7
log($table.dataFloat64[(pi + 4) >> 3]);
//=> 3.141592653589793


// tree
var tree = Table.findPointer($table, treeHash, 0);
log(tree, hexHash($table.hashes8, tree));
//=> 132 'e92993fcf3ac79777e33c872279a15956a3df4d9'
log($table.data8[Table.typeOffset(tree)], Type.tree);
//=> 9 9
var pointer32 = tree >> 2;
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
log(moldIndex);
//=> 1
var mold32 = Mold.data32_size * moldIndex;
var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
log(pretty($mold.fileArray, fileStart, fileEnd));
//=> tree 133\x00100644 answer\x00\xf7\x0d\x7b\xbaJ\xe1\xf0v\x82\xe05\x8b\xd7\xa2\x06\x80\x94\xfc\x02;100644 message\x00K\xca\xa359/O\x0f\xb3_\xdaX\x01\x7dA\xfa\x07\xdd\xeb\x8b40000 missing\x00\x1d\xbf\xb8\xa3s\x21\x96d\xf5\xae\xd3\xa6r\xac\xf4\xbf9\xc8\xfbR100644 pi\x00\xe5\xc1\xce\xbc\xac\xfc\x81\xcfQ\xa6\x1c\x03\x1eqm\x87I\x816\x0e
var mold8 = Mold.data8_size * moldIndex;
var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];
log(numChildren);
//=> 4
var childPointer = $table.data32[pointer32 + 0];
log(childPointer, answer);
//=> 24 24
childPointer = $table.data32[pointer32 + 1];
log(childPointer, message);
//=> 4 4
var missing = Table.findPointer($table, missingHash, 0);
childPointer = $table.data32[pointer32 + 2];
log(childPointer, missing);
//=> 88 88
log($table.data8[Table.typeOffset(missing)], Type.pending);
//=> 1 1
childPointer = $table.data32[pointer32 + 3];
log(childPointer, pi);
//=> 44 44
