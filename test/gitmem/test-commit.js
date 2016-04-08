'use strict';
require('../helper');

global.$heap = Heap.create(4096);
var $h = $heap.array;
var random = Random.create(28591);
global.$hashTable = HashTable.create(8, random);
global.$objects = Objects.create(8);
global.$packIndex = PackIndex.create(8);
global.$packData = PackData.create(1024);
global.$fileCache = FileCache.create(8, 2048);

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
Sha1.hash($fileCache.array, fooStart, fooEnd, $h, fooHashOffset);

var treeHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($h, treeStart, treeEnd, $h, treeHashOffset);
log(hash($h, treeHashOffset));
//=> 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
var hashOffset = ~HashTable.findHashOffset($hashTable, $h, treeHashOffset);
HashTable.setHash($hashTable, hashOffset, $h, treeHashOffset);
treeHashOffset = hashOffset;

var parentHashOffset = ~HashTable.findHashOffset($hashTable, $h, CommitFile.initialHashOffset);
HashTable.setHash($hashTable, parentHashOffset, $h, CommitFile.initialHashOffset);

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
log(pretty($fileCache.array, commit.fileStart, commit.fileEnd));
//=> commit 237\x00tree 83eb8cbb4c40875b937d27dd3224c1ceb36e449a
//=> parent 362f278d085c99a7adfbb1d74a57dd68db0109a9
//=> author Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454907687 -0600
//=>
//=> Initial commit
//=>
log(hash($hashTable.array, commit.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
var searchHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, commit.fileStart, commit.fileEnd, $h, searchHashOffset);
var hashOffset = HashTable.findHashOffset($hashTable, $h, searchHashOffset);
log(hashOffset, hash($hashTable.array, hashOffset));
//=> 68 '265810bdf30c4e41cf5cc72f27a2e8559752b6a8'
var objectIndex = HashTable.objectIndex(commit.hashOffset);
var type = $hashTable.array[HashTable.typeOffset(commit.hashOffset)];
log(type & HashTable.isObject);
//=> 64
log(type & HashTable.isFileCached);
//=> 128
var savedCommit = $objects.table[objectIndex];
log(objectIndex, savedCommit.authorTime);
//=> 3 1454907687000



var secondCommit = Commit.setAll(commit, {
    authorName: 'snakes',
    authorTimezoneOffset: 480,
    parent: commit,
});

searchHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, secondCommit.fileStart, secondCommit.fileEnd, $h, searchHashOffset);
hashOffset = HashTable.findHashOffset($hashTable, $h, searchHashOffset);
log(hashOffset, hash($hashTable.array, hashOffset));
//=> 132 '46a0cef9b97fb229a4b763b29a6ec9fb24b298e6'

log(secondCommit.authorName, secondCommit.authorTimezoneOffset);
//=> snakes 480
log(hash($hashTable.array, secondCommit.parent.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
log(hash($hashTable.array, secondCommit.hashOffset));
//=> 46a0cef9b97fb229a4b763b29a6ec9fb24b298e6








// Pack all the above
var oldHashArray = $hashTable.array;
global.$hashTable = HashTable.create(8, random);

hashOffset = ~HashTable.findHashOffset($hashTable, oldHashArray, secondCommit.hashOffset);
HashTable.setHash($hashTable, hashOffset, oldHashArray, secondCommit.hashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
// Clear cache to ensure checkout from packData
$hashTable.array[HashTable.typeOffset(hashOffset)] &= ~HashTable.isFileCached;
$packIndex.offsets[objectIndex] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, secondCommit.fileStart, secondCommit.fileEnd);

hashOffset = ~HashTable.findHashOffset($hashTable, oldHashArray, commit.hashOffset);
HashTable.setHash($hashTable, hashOffset, oldHashArray, commit.hashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$packIndex.offsets[objectIndex] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, commit.fileStart, commit.fileEnd);
// Save first commit
$objects.table[objectIndex] = commit;
$hashTable.array[HashTable.typeOffset(hashOffset)] |= HashTable.isObject;

hashOffset = ~HashTable.findHashOffset($hashTable, oldHashArray, treeHashOffset);
HashTable.setHash($hashTable, hashOffset, oldHashArray, treeHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$packIndex.offsets[objectIndex] = $packData.nextOffset;
log(objectIndex, $packData.nextOffset);
//=> 6 321
PackData.packFile($packData, $h, treeStart, treeEnd);

hashOffset = ~HashTable.findHashOffset($hashTable, $h, fooHashOffset);
HashTable.setHash($hashTable, hashOffset, $h, fooHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$packIndex.offsets[objectIndex] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, fooStart, fooEnd);


var gotSecondCommit = Commit.checkout(oldHashArray, secondCommit.hashOffset);
log(hash($hashTable.array, gotSecondCommit.hashOffset));
//=> 46a0cef9b97fb229a4b763b29a6ec9fb24b298e6
type = $hashTable.array[HashTable.typeOffset(gotSecondCommit.hashOffset)];
log(type & HashTable.isFileCached);
//=> 128
var cacheIndex = $packIndex.offsets[HashTable.objectIndex(gotSecondCommit.hashOffset)];
log(cacheIndex);
//=> 2
log(pretty($fileCache.array, $fileCache.fileStarts[cacheIndex], $fileCache.fileEnds[cacheIndex]));
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
log(gotCommit === commit);
//=> true
log(hash($hashTable.array, gotCommit.hashOffset));
//=> 265810bdf30c4e41cf5cc72f27a2e8559752b6a8
log(gotCommit.authorName, gotCommit.committerEmail);
//=> Jake Sandlund jake@jakesandlund.com
