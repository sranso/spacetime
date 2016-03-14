'use strict';
require('../helper');

global.$Heap = Heap.create(4096);
global.$ = $Heap.array;
var random = Random.create(28591);
global.$HashTable = HashTable.create(8, $Heap, random);
global.$Objects = Objects.create(8);
global.$PackIndex = PackIndex.create(8);
global.$PackData = PackData.create(1024);

PackIndex.initialize();
CommitFile.initialize();
Commit.initialize();

var fooRange = Value.createBlob('string', 'foo');
var fooStart = fooRange[0];
var fooEnd = fooRange[1];

var tree = Tree.create({
    foo: 'blob',
});
var treeStart = tree[0];
var treeEnd = tree[1];
var offsets = tree[2];

var fooHashOffset = treeStart + offsets.foo;
Sha1.hash($, fooStart, fooEnd, $, fooHashOffset);

var treeHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, treeStart, treeEnd, $, treeHashOffset);
log(hash($, treeHashOffset));
//=> 83eb8cbb4c40875b937d27dd3224c1ceb36e449a

var commit = Commit.setAll(Commit.none, {
    tree: {hashOffset: treeHashOffset},
    parent: {hashOffset: CommitFile.initialHashOffset},

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
log(pretty($, commit.fileStart, commit.fileEnd));
//=> commit 237\x00tree 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
//=> parent 362f278d085c99a7adfbb1d74a57dd68db0109a9
//=> author Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=>
//=> Initial commit
//=>
log(hash($, commit.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
var hashOffset = HashTable.findHashOffset($HashTable, commit.hashOffset);
log(hashOffset, hash($, hashOffset));
//=> 68 '265810bdf30c4e41cf5cc72f27a2e8559752b6a8'
var objectIndex = HashTable.objectIndex($HashTable, commit.hashOffset);
var savedCommit = $Objects.table[objectIndex];
log(objectIndex, savedCommit.authorTime);
//=> 3 1454907687000
log(savedCommit.flags & Objects.isFullObject);
//=> 1

var secondCommit = Commit.setAll(commit, {
    authorName: 'snakes',
    authorTimezoneOffset: 480,
    parent: commit,
});

log(secondCommit.authorName, secondCommit.authorTimezoneOffset);
//=> snakes 480
log(hash($, secondCommit.parent.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
log(hash($, secondCommit.hashOffset));
//=> 46a0cef9b97fb229a4b763b29a6ec9fb24b298e6








// Pack all the above
global.$HashTable = HashTable.create(8, $Heap, random);

hashOffset = ~HashTable.findHashOffset($HashTable, secondCommit.hashOffset);
HashTable.setHash($HashTable, hashOffset, secondCommit.hashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, secondCommit.fileStart, secondCommit.fileEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, commit.hashOffset);
HashTable.setHash($HashTable, hashOffset, commit.hashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, commit.fileStart, commit.fileEnd);
// Save first commit
$Objects.table[objectIndex] = commit;

hashOffset = ~HashTable.findHashOffset($HashTable, treeHashOffset);
HashTable.setHash($HashTable, hashOffset, treeHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
log(objectIndex, $PackData.nextOffset);
//=> 6 321
PackData.packFile($PackData, treeStart, treeEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, fooHashOffset);
HashTable.setHash($HashTable, hashOffset, fooHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, fooStart, fooEnd);


var gotSecondCommit = Commit.checkout(secondCommit.hashOffset);
log(hash($, gotSecondCommit.hashOffset));
//=> 46a0cef9b97fb229a4b763b29a6ec9fb24b298e6
log(gotSecondCommit.authorName, gotSecondCommit.authorTimezoneOffset);
//=> snakes 480
log(pretty($, gotSecondCommit.fileStart, gotSecondCommit.fileEnd));
//=> commit 230\x00tree 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
//=> parent 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
//=> author snakes <jake@jakesandlund.com> 1454907687 -0800
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=>
//=> Initial commit
//=>

Commit.checkoutParents(gotSecondCommit);
var gotCommit = gotSecondCommit.parent;
log(hash($, gotCommit.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
log(gotCommit.authorName, gotCommit.committerEmail);
//=> Jake Sandlund jake@jakesandlund.com
