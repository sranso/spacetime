'use strict';
require('../../test/helper');

global.$heap = Heap.create(4096);
var $h = $heap.array;
global.$table = Table.create(8, Random.create(28591));
global.$packData = PackData.create(512);
global.$fileCache = FileCache.create(8, 2048);

CommitFile.initialize();
Commit.initialize();

var fooRange = Value.createBlob('foo', 'string', []);
var fooStart = fooRange[0];
var fooEnd = fooRange[1];

var offsets = {};
var treeRange = Tree.create({
    foo: 'blob',
}, offsets, []);
var treeStart = treeRange[0];
var treeEnd = treeRange[1];

var fooPointer = treeStart + offsets.foo;
Sha1.hash($fileCache.array, fooStart, fooEnd, $h, fooPointer);

var treePointer = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($h, treeStart, treeEnd, $h, treePointer);
log(hexHash($h, treePointer));
//=> 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
var pointer = ~Table.findPointer($table, $h, treePointer);
Table.setHash($table, pointer, $h, treePointer);
treePointer = pointer;

var parentPointer = ~Table.findPointer($table, $h, CommitFile.initialPointer);
Table.setHash($table, parentPointer, $h, CommitFile.initialPointer);

var commit = Commit.setAll(Commit.none, {
    tree: {pointer: treePointer},
    parent: {pointer: parentPointer},

    authorName: 'Jake Sandlund',
    authorEmail: 'jake@jakesandlund.com',
    authorTime: 1454907687000,
    authorTimezoneOffset: 360,

    committerName: 'Jake Sandlund',
    committerEmail: 'jake@jakesandlund.com',
    committerTime: 1454907687000,
    committerTimezoneOffset: 360,

    message: 'Initial commit\n',
});

log(commit.authorName, commit.committerEmail);
//=> Jake Sandlund jake@jakesandlund.com
var type = $table.hashes8[Table.typeOffset(commit.pointer)];
log(type & Table.isObject);
//=> 64
log(type & Table.isFileCached);
//=> 128
var cacheIndex = $table.data32[(pointer >> 2) + Table.data32_cacheIndex];
var fileStart = $fileCache.fileRanges[2 * cacheIndex];
var fileEnd = $fileCache.fileRanges[2 * cacheIndex + 1];
log(pretty($fileCache.array, fileStart, fileEnd));
//=> commit 237\x00tree 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
//=> parent 362f278d085c99a7adfbb1d74a57dd68db0109a9
//=> author Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=>
//=> Initial commit
//=>
log(hexHash($table.hashes8, commit.pointer));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
var searchPointer = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, fileStart, fileEnd, $h, searchPointer);
var pointer = Table.findPointer($table, $h, searchPointer);
log(pointer, hexHash($table.hashes8, pointer));
//=> 68 '265810bdf30c4e41cf5cc72f27a2e8559752b6a8'
var objectIndex = Table.objectIndex(commit.pointer);
var savedCommit = $table.objects[objectIndex];
log(savedCommit.authorTime, savedCommit === commit);
//=> 1454907687000 true



var secondCommit = Commit.setAll(commit, {
    authorName: 'snakes',
    authorTimezoneOffset: 480,
    parent: commit,
});

log(secondCommit.pointer, hexHash($table.hashes8, secondCommit.pointer));
//=> 132 '46a0cef9b97fb229a4b763b29a6ec9fb24b298e6'

log(secondCommit.authorName, secondCommit.authorTimezoneOffset);
//=> snakes 480
log(hexHash($table.hashes8, secondCommit.parent.pointer));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8

cacheIndex = $table.data32[(secondCommit.pointer >> 2) + Table.data32_cacheIndex];
var secondFileStart = $fileCache.fileRanges[2 * cacheIndex];
var secondFileEnd = $fileCache.fileRanges[2 * cacheIndex + 1];








// Pack all the above
var oldHashArray = $table.hashes8;
global.$table = Table.create(8, random);

pointer = ~Table.findPointer($table, oldHashArray, secondCommit.pointer);
Table.setHash($table, pointer, oldHashArray, secondCommit.pointer);
objectIndex = Table.objectIndex(pointer);
$table.data32[(pointer >> 2) + Table.data32_packOffset] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, secondFileStart, secondFileEnd);

pointer = ~Table.findPointer($table, oldHashArray, commit.pointer);
Table.setHash($table, pointer, oldHashArray, commit.pointer);
objectIndex = Table.objectIndex(pointer);
// Save first commit
$table.objects[objectIndex] = commit;
$table.hashes8[Table.typeOffset(pointer)] |= Table.isObject;

pointer = ~Table.findPointer($table, oldHashArray, treePointer);
Table.setHash($table, pointer, oldHashArray, treePointer);
$table.data32[(pointer >> 2) + Table.data32_packOffset] = $packData.nextOffset;
PackData.packFile($packData, $h, treeStart, treeEnd);

pointer = ~Table.findPointer($table, $h, fooPointer);
Table.setHash($table, pointer, $h, fooPointer);
$table.data32[(pointer >> 2) + Table.data32_packOffset] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, fooStart, fooEnd);


var gotSecondCommit = Commit.checkout(oldHashArray, secondCommit.pointer);
log(hexHash($table.hashes8, gotSecondCommit.pointer));
//=> 46a0cef9b97fb229a4b763b29a6ec9fb24b298e6
type = $table.hashes8[Table.typeOffset(gotSecondCommit.pointer)];
log(type & Table.isFileCached);
//=> 128
var cacheIndex = $table.data32[(gotSecondCommit.pointer >> 2) + Table.data32_cacheIndex];
log(cacheIndex);
//=> 2
fileStart = $fileCache.fileRanges[2 * cacheIndex];
fileEnd = $fileCache.fileRanges[2 * cacheIndex + 1];
log(pretty($fileCache.array, fileStart, fileEnd));
//=> commit 230\x00tree 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
//=> parent 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
//=> author snakes <jake@jakesandlund.com> 1454907687 -0800
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=>
//=> Initial commit
//=>
log(gotSecondCommit.authorName, gotSecondCommit.authorTimezoneOffset);
//=> snakes 480


// Checkout with file cached
Commit.checkoutParents(gotSecondCommit);
var gotCommit = gotSecondCommit.parent;
log(gotCommit === commit);
//=> true
log(hexHash($table.hashes8, gotCommit.pointer));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
log(gotCommit.authorName, gotCommit.committerEmail);
//=> Jake Sandlund jake@jakesandlund.com

// TODO: Checkout without file cached recreates the file

// TODO: Checkout tree
