'use strict';
require('../../test/helper');

global.$file = new Uint8Array(512);
global.$pack = new Uint8Array(1024);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(32, Random.create(526926));
global.$mold = Mold.create(16, 2048);

Constants.initialize(-1, 1);
Commit.initialize();
ArrayTree.initialize(1);

$pack[11] = 8;  // Number of packed files.
var packOffset = 12;

var messageLength = Blob.create($file, '"I <3 short messages');
var messageHash = new Uint8Array(20);
Sha1.hash($file, 0, messageLength, messageHash, 0);
log(hexHash(messageHash, 0));
//=> 4bcaa335392f4f0fb35fda58017d41fa07ddeb8b
packOffset = PackData.packFile(packOffset, $file, 0, messageLength);

var message20Length = Blob.create($file, '"I am a string20 msg!');
var message20Hash = new Uint8Array(20);
Sha1.hash($file, 0, message20Length, message20Hash, 0);
log(hexHash(message20Hash, 0));
//=> 41b606864613f7dabff68d2fc548c208d457ca6d
packOffset = PackData.packFile(packOffset, $file, 0, message20Length);

var longMessageLength = Blob.create($file, '"I am a longer message');
var longMessageHash = new Uint8Array(20);
Sha1.hash($file, 0, longMessageLength, longMessageHash, 0);
log(hexHash(longMessageHash, 0));
//=> c6de9479651cdd8de13f3ae1f521a9ad68a4c484
packOffset = PackData.packFile(packOffset, $file, 0, longMessageLength);

var answerLength = Blob.create($file, '42');
var answerHash = new Uint8Array(20);
Sha1.hash($file, 0, answerLength, answerHash, 0);
log(hexHash(answerHash, 0));
//=> f70d7bba4ae1f07682e0358bd7a2068094fc023b
packOffset = PackData.packFile(packOffset, $file, 0, answerLength);

var piLength = Blob.create($file, '3.141592653589793');
var piHash = new Uint8Array(20);
Sha1.hash($file, 0, piLength, piHash, 0);
log(hexHash(piHash, 0));
//=> e5c1cebcacfc81cf51a61c031e716d874981360e
packOffset = PackData.packFile(packOffset, $file, 0, piLength);

// Tree
var treeLength = Tree.create($file, {
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
var treePointer = ~Table.findPointer($table, treeHash, 0);
Table.setHash($table, treePointer, treeHash, 0);
packOffset = PackData.packFile(packOffset, $file, 0, treeLength);

// ArrayTree
var pointer = ArrayTree.$zeros[0];
var pointer32 = pointer >> 2;
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
var mold32 = moldIndex * Mold.data32_size;
var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
var arrayTreeHash = $table.hashes8.slice(pointer, pointer + 20);
log(hexHash(arrayTreeHash, 0));
//=> 177f17fca445dd21024bcd401d52fb0fa07d4905
log(pretty($mold.fileArray, fileStart, fileEnd));
//=> tree 43\x00100644 .empty-array:L0\x00\x9dh\x93<D\xf19\x85\xb9\xeb\x19\x15\x9d\xa6\xeb?\xf0\xe5t\xbf
packOffset = PackData.packFile(packOffset, $mold.fileArray, fileStart, fileEnd);

// Commit
var user = set($[Commit.User.zero],
               Commit.User.email, hash('jake@jakesandlund.com'),
               Commit.User.timezoneOffset, hash(360),
               Commit.User.name, hash('Jake Sandlund'));

var info = set($[Commit.Info.zero],
               Commit.Info.author, user,
               Commit.Info.committer, user);

var commitPointer = createCommit($[Commit.zero],
        Commit.message, hash('My test commit'),
        Commit.committerTime, hash(1463772798),
        Commit.tree, treePointer,
        Commit.info, info,
        Commit.parent, $[Commit.zero]);
var commitHash = $table.hashes8.slice(commitPointer, commitPointer + 20);
log(hexHash(commitHash, 0));
//=> eab45eefb16fc80f6276b62192229e41799d4c30
var commitParentHash = $table.hashes8.slice($[Commit.zero], $[Commit.zero] + 20);
var commitLength = 247;
log(pretty($file, 0, commitLength));
//=> commit 236\x00tree e92993fcf3ac79777e33c872279a15956a3df4d9
//=> parent cf2f19e7e3692eadb7e6e9e37f63d29f8b5ced7c
//=> author Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=>
//=> My test commit
packOffset = PackData.packFile(packOffset, $file, 0, commitLength);

log(packOffset);
//=> 492
Sha1.hash($pack, 0, packOffset, $pack, packOffset);
log(hexHash($pack, packOffset));
//=> df0f78675d85bcbba92e6ce1eca754f4cbe24bbb







global.$table = Table.create(32, Random.create(15962822));
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
Constants.initialize(-1, 1);
Commit.initialize();

Unpack.unpack($pack);

// message
var message = Table.findPointer($table, messageHash, 0);
log(hexHash($table.hashes8, message));
//=> 4bcaa335392f4f0fb35fda58017d41fa07ddeb8b
var type = $table.data8[Table.typeOffset(message)];
log(type & Type.mask, Type.string);
//=> 4 4
log(type & Type.onServer);
//=> 128
log($table.data8[message + Table.data8_stringLength]);
//=> 19
log($table.data8[message + 0], 'I'.charCodeAt(0));
//=> 73 73
log($table.data8[message + 1], ' '.charCodeAt(0));
//=> 32 32
log($table.data8[message + 18], 's'.charCodeAt(0));
//=> 115 115


// message20
var message20 = Table.findPointer($table, message20Hash, 0);
log(hexHash($table.hashes8, message20));
//=> 41b606864613f7dabff68d2fc548c208d457ca6d
var type = $table.data8[Table.typeOffset(message20)];
log(type & Type.mask, Type.string20);
//=> 5 5
log(type & Type.onServer);
//=> 128
log($table.data8[message20 + Table.data8_stringLength]);
//=> 33
log($table.data8[message20 + 0], 'I'.charCodeAt(0));
//=> 73 73
log($table.data8[message20 + 1], ' '.charCodeAt(0));
//=> 32 32
log($table.data8[message20 + 19], '!'.charCodeAt(0));
//=> 33 33


// longMessage
var longMessage = Table.findPointer($table, longMessageHash, 0);
log(hexHash($table.hashes8, longMessage));
//=> c6de9479651cdd8de13f3ae1f521a9ad68a4c484
var type = $table.data8[Table.typeOffset(longMessage)];
log(type & Type.mask, Type.longString);
//=> 6 6
log(type & Type.onServer);
//=> 128
var longStringI = $table.data32[(longMessage >> 2) + 0];
log(longStringI);
//=> 0
log($table.dataLongStrings[longStringI]);
//=> I am a longer message


// answer
var answer = Table.findPointer($table, answerHash, 0);
var answerPointer = answer;
log(hexHash($table.hashes8, answer));
//=> f70d7bba4ae1f07682e0358bd7a2068094fc023b
var type = $table.data8[Table.typeOffset(answer)];
log(type & Type.mask, Type.integer);
//=> 7 7
log(type & Type.onServer);
//=> 128
log($table.dataInt32[(answer >> 2) + 0]);
//=> 42


// pi
var pi = Table.findPointer($table, piHash, 0);
var piPointer = pi;
log(hexHash($table.hashes8, pi));
//=> e5c1cebcacfc81cf51a61c031e716d874981360e
var type = $table.data8[Table.typeOffset(pi)];
log(type & Type.mask, Type.float);
//=> 8 8
log(type & Type.onServer);
//=> 128
log($table.dataFloat64[(pi + 4) >> 3]);
//=> 3.141592653589793


// tree
var tree = Table.findPointer($table, treeHash, 0);
log(hexHash($table.hashes8, tree));
//=> e92993fcf3ac79777e33c872279a15956a3df4d9
var type = $table.data8[Table.typeOffset(tree)];
log(type & Type.mask, Type.tree);
//=> 9 9
log(type & Type.onServer);
//=> 128
var pointer32 = tree >> 2;
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
log(moldIndex);
//=> 13
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
//=> 344 344
childPointer = $table.data32[pointer32 + 1];
log(childPointer, message);
//=> 152 152
var missing = Table.findPointer($table, missingHash, 0);
childPointer = $table.data32[pointer32 + 2];
log(childPointer, missing);
//=> 364 364
log($table.data8[Table.typeOffset(missing)], Type.pending);
//=> 1 1
childPointer = $table.data32[pointer32 + 3];
log(childPointer, pi);
//=> 44 44


// arrayTree
var arrayTree = Table.findPointer($table, arrayTreeHash, 0);
log(hexHash($table.hashes8, arrayTree));
//=> 177f17fca445dd21024bcd401d52fb0fa07d4905
var type = $table.data8[Table.typeOffset(arrayTree)];
log(type & Type.mask, Type.tree);
//=> 9 9
log(type & Type.onServer);
//=> 128


// commit
var commitPointer = Table.findPointer($table, commitHash, 0);
log(commitPointer);
//=> 580
log(hexHash($table.hashes8, commitPointer));
//=> eab45eefb16fc80f6276b62192229e41799d4c30
var type = $table.data8[Table.typeOffset(commitPointer)];
log(type & Type.mask, Type.commit);
//=> 2 2
log(type & Type.onServer);
//=> 128
log(val(get(commitPointer, Commit.message)));
//=> My test commit
log(val(get(commitPointer, Commit.committerTime)));
//=> 1463772798
log(val(get(get(commitPointer, Commit.tree), 1))); // message
//=> I <3 short messages
log(get(commitPointer, Commit.parent), $[Commit.zero]);
//=> 88 88
log(val(get(get(get(commitPointer, Commit.info), Commit.Info.author), Commit.User.email)));
//=> jake@jakesandlund.com
