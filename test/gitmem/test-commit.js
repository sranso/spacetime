'use strict';
require('../helper');

global.$Heap = Heap.create(4096);
var $h = $Heap.array;
var random = Random.create(28591);
global.$HashTable = HashTable.create(8, random);
global.$Objects = Objects.create(8);
global.$PackIndex = PackIndex.create(8);
global.$PackData = PackData.create(1024);
global.$FileCache = FileCache.create(8, 2048);

PackIndex.initialize();
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

var fooHashOffset = treeStart + offsets.foo;
Sha1.hash($h, fooStart, fooEnd, $h, fooHashOffset);

var treeHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($h, treeStart, treeEnd, $h, treeHashOffset);
log(hash($h, treeHashOffset));
//=> 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
var hashOffset = ~HashTable.findHashOffset($HashTable, $h, treeHashOffset);
HashTable.setHash($HashTable, hashOffset, $h, treeHashOffset);
treeHashOffset = hashOffset;

var parentHashOffset = ~HashTable.findHashOffset($HashTable, $h, CommitFile.initialHashOffset);
HashTable.setHash($HashTable, parentHashOffset, $h, CommitFile.initialHashOffset);

var commit = Commit.setAll(Commit.none, {
    tree: {hashOffset: treeHashOffset},
    parent: {hashOffset: parentHashOffset},

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
log(pretty($h, commit.fileStart, commit.fileEnd));
//=> commit 237\x00tree 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
//=> parent 362f278d085c99a7adfbb1d74a57dd68db0109a9
//=> author Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=>
//=> Initial commit
//=>
log(hash($HashTable.array, commit.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
var searchHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($h, commit.fileStart, commit.fileEnd, $h, searchHashOffset);
var hashOffset = HashTable.findHashOffset($HashTable, $h, searchHashOffset);
log(hashOffset, hash($HashTable.array, hashOffset));
//=> 68 '265810bdf30c4e41cf5cc72f27a2e8559752b6a8'
var objectIndex = HashTable.objectIndex(commit.hashOffset);
var type = $HashTable.array[HashTable.typeOffset(commit.hashOffset)];
log(type & HashTable.isObject);
//=> 64
var savedCommit = $Objects.table[objectIndex];
log(objectIndex, savedCommit.authorTime);
//=> 3 1454907687000



var secondCommit = Commit.setAll(commit, {
    authorName: 'snakes',
    authorTimezoneOffset: 480,
    parent: commit,
});

searchHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($h, secondCommit.fileStart, secondCommit.fileEnd, $h, searchHashOffset);
hashOffset = HashTable.findHashOffset($HashTable, $h, searchHashOffset);
log(hashOffset, hash($HashTable.array, hashOffset));
//=> 132 '46a0cef9b97fb229a4b763b29a6ec9fb24b298e6'

log(secondCommit.authorName, secondCommit.authorTimezoneOffset);
//=> snakes 480
log(hash($HashTable.array, secondCommit.parent.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
log(hash($HashTable.array, secondCommit.hashOffset));
//=> 46a0cef9b97fb229a4b763b29a6ec9fb24b298e6








// Pack all the above
var oldHashArray = $HashTable.array;
global.$HashTable = HashTable.create(8, random);

hashOffset = ~HashTable.findHashOffset($HashTable, oldHashArray, secondCommit.hashOffset);
HashTable.setHash($HashTable, hashOffset, oldHashArray, secondCommit.hashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, $h, secondCommit.fileStart, secondCommit.fileEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, oldHashArray, commit.hashOffset);
HashTable.setHash($HashTable, hashOffset, oldHashArray, commit.hashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, $h, commit.fileStart, commit.fileEnd);
// Save first commit
$Objects.table[objectIndex] = commit;

hashOffset = ~HashTable.findHashOffset($HashTable, oldHashArray, treeHashOffset);
HashTable.setHash($HashTable, hashOffset, oldHashArray, treeHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
log(objectIndex, $PackData.nextOffset);
//=> 6 321
PackData.packFile($PackData, $h, treeStart, treeEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, $h, fooHashOffset);
HashTable.setHash($HashTable, hashOffset, $h, fooHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, $h, fooStart, fooEnd);


var gotSecondCommit = Commit.checkout(oldHashArray, secondCommit.hashOffset);
log(hash($HashTable.array, gotSecondCommit.hashOffset));
//=> 46a0cef9b97fb229a4b763b29a6ec9fb24b298e6
type = $HashTable.array[HashTable.typeOffset(gotSecondCommit.hashOffset)];
log(type & HashTable.isFileCached);
//=> 128
var cacheIndex = $PackIndex.offsets[HashTable.objectIndex(gotSecondCommit.hashOffset)];
log(cacheIndex);
//=> 0
log(pretty($FileCache.array, $FileCache.fileStarts[cacheIndex], $FileCache.fileEnds[cacheIndex]));
//=> commit 230\x00tree 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
//=> parent 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
//=> author snakes <jake@jakesandlund.com> 1454907687 -0800
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=>
//=> Initial commit
//=>
log(gotSecondCommit.authorName, gotSecondCommit.authorTimezoneOffset);
//=> snakes 480

Commit.checkoutParents(gotSecondCommit);
var gotCommit = gotSecondCommit.parent;
log(hash($HashTable.array, gotCommit.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
log(gotCommit.authorName, gotCommit.committerEmail);
//=> Jake Sandlund jake@jakesandlund.com
