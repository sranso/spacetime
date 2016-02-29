'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
global.$ = $Heap.array;
var random = Random.create(526922);
global.$HashTable = HashTable.create(8, $Heap, random);
global.$PackData = PackData.create(512);

PackIndex.initialize();

var blobRange = Blob.createFromString('FOO bar\n');
var blobStart = blobRange[0];
var blobEnd = blobRange[1];

var tree = Tree.create({
    foo: 'blob',
});
var treeStart = tree[0];
var treeEnd = tree[1];
var offsets = tree[2];
var blobHashOffset = treeStart + offsets.foo;
Sha1.hash($, blobStart, blobEnd, $, blobHashOffset);

var treeHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, treeStart, treeEnd, $, treeHashOffset);
log(hash($, treeHashOffset));
//=> 7c0ac9607b0f31f1e3848f17bbdeb34e83f1ed45

var author = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    time: 1454738689000,
    timezoneOffset: 360,
};

var commitObject = {
    tree: {hashOffset: treeHashOffset},
    parents: [],
    committer: author,
    author: author,
    message: 'Foo commit\n',
};

var commitRange = CommitFile.createFromObject(commitObject);
var commitStart = commitRange[0];
var commitEnd = commitRange[1];
var commitHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, commitStart, commitEnd, $, commitHashOffset);
log(hash($, commitHashOffset));
//=> e13ec39a3681e3a588ed8c4890fb446a8eebba27

var inputPackData = PackData.create(216);
inputPackData.array[11] = 3;  // Number of packed files.
inputPackData.nextOffset = 12;
PackData.packFile(inputPackData, commitStart, commitEnd);
PackData.packFile(inputPackData, treeStart, treeEnd);
PackData.packFile(inputPackData, blobStart, blobEnd);

var inputPackHashOffset = inputPackData.nextOffset;
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackHashOffset, inputPack, inputPackHashOffset);
log(hash(inputPack, inputPackHashOffset));
//=> 32bdee2310d4f3f2f8b10cad24367f9ffc784265








var index = PackIndex.create($HashTable.n);
log(index.offsets.length);
//=> 8

PackIndex.indexPack(index, inputPack);

var hashOffset = HashTable.findHashOffset($HashTable, commitHashOffset);
log(hashOffset, hash($, hashOffset));
//=> 68 'e13ec39a3681e3a588ed8c4890fb446a8eebba27'
var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
log(objectIndex, index.offsets[objectIndex]);
//=> 3 0

hashOffset = HashTable.findHashOffset($HashTable, treeHashOffset);
log(hashOffset, hash($, hashOffset));
//=> 4 '7c0ac9607b0f31f1e3848f17bbdeb34e83f1ed45'
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
log(objectIndex, index.offsets[objectIndex]);
//=> 0 125


hashOffset = HashTable.findHashOffset($HashTable, blobHashOffset);
var file = PackIndex.lookupFile(index, hashOffset);
var fileStart = file[0];
var fileEnd = file[1];
log(pretty($, fileStart, fileEnd));
//=> blob 8\x00FOO bar
//=>
