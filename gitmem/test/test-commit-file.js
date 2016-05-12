'use strict';
require('../../test/helper');

global.$fileCache = FileCache.create(2, 512);
global.$heap = Heap.create(512);
var $h = $heap.array;
global.$table = {hashes8: new Uint8Array(128)};

CommitFile.initialize();
log(CommitFile._initialStart, CommitFile._initialEnd);
//=> 0 200
log(pretty($h, CommitFile._initialStart, CommitFile._initialEnd));
//=> commit 189\x00tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904
//=> author Jake Sandlund <jake@jakesandlund.com> 1457216632 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1457216632 -0600
//=>
//=> Initial commit
//=>

log(hexHash($h, CommitFile.initialPointer));
//=> 362f278d085c99a7adfbb1d74a57dd68db0109a9

log(CommitFile.timezoneString(360));
//=> -0600

log(CommitFile.timezoneString(-90));
//=> +0130

// Recreate a real commit.

var blobRange = Blob.create('foo\n', []);
var offsets = {};
var treeRange = Tree.create({
    foo: 'blob',
}, offsets, []);
var treeStart = treeRange[0];
var treeEnd = treeRange[1];
Sha1.hash($fileCache.array, blobRange[0], blobRange[1], $h, treeStart + offsets.foo);

var hashesNextOffset = 0;
var treePointer = hashesNextOffset;
hashesNextOffset += 20;
Sha1.hash($h, treeStart, treeEnd, $table.hashes8, treePointer);
log(hexHash($table.hashes8, treePointer));
//=> 205f6b799e7d5c2524468ca006a0131aa57ecce7

var parentHash = new Uint8Array([0x4e,0x72,0x11,0x0c,0xbb,0x91,0xdd,0x87,0xf7,0xb7,0xee,0xa2,0x2f,0x5f,0x0b,0xcb,0x23,0x3e,0x95,0xbf]);
var parentPointer = hashesNextOffset;
hashesNextOffset += 20;
Convert.arrayToExistingArray($table.hashes8, parentPointer, parentHash);

var commitObject = {
    tree: {pointer: treePointer},
    parent: {pointer: parentPointer},
    mergeParent: null,

    authorName: 'Jake Sandlund',
    authorEmail: 'jake@jakesandlund.com',
    authorTime: 1454274859000,
    authorTimezoneOffset: 360,

    committerName: 'Jake Sandlund',
    committerEmail: 'jake@jakesandlund.com',
    committerTime: 1454274859000,
    committerTimezoneOffset: 360,

    message: 'Foo commit\n',
};

var commitRange = CommitFile.create(commitObject, []);
var commitStart = commitRange[0];
var commitEnd = commitRange[1];

log(pretty($fileCache.array, commitStart, commitEnd));
//=> commit 233\x00tree 205f6b799e7d5c2524468ca006a0131aa57ecce7
//=> parent 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
//=> author Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=>
//=> Foo commit
//=>

var commitPointer = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, commitStart, commitEnd, $h, commitPointer);
log(hexHash($h, commitPointer));
//=> dbcb62b19db062d928144514502df45e86d91eac

treePointer = $heap.nextOffset;
$heap.nextOffset += 20;
CommitFile.parseTree($fileCache.array, commitStart, commitEnd, $h, treePointer);
log(hexHash($h, treePointer));
//=> 205f6b799e7d5c2524468ca006a0131aa57ecce7

var parentHashesOffset = $heap.nextOffset;
$heap.nextOffset += 2 * 20;
var nParents = CommitFile.parseParents($fileCache.array, commitStart, commitEnd, $h, parentHashesOffset);
log(nParents, hexHash($h, parentHashesOffset));
//=> 1 '4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf'

var gotCommit = {};
CommitFile.parse($fileCache.array, commitStart, commitEnd, gotCommit);
log(gotCommit.authorName, gotCommit.authorEmail);
//=> Jake Sandlund jake@jakesandlund.com
log(gotCommit.authorTime, gotCommit.authorTimezoneOffset);
//=> 1454274859000 360
log(gotCommit.committerName, gotCommit.committerEmail);
//=> Jake Sandlund jake@jakesandlund.com
log(gotCommit.committerTime, gotCommit.committerTimezoneOffset);
//=> 1454274859000 360
log(gotCommit.message);
//=> Foo commit
//=>








var secondParentString = 'secondParent';
var secondParentStart = $heap.nextOffset;
var secondParentEnd = secondParentStart + secondParentString.length;
$heap.nextOffset = secondParentEnd;
Convert.stringToExistingArray($h, secondParentStart, secondParentString);
var secondParentPointer = hashesNextOffset;
hashesNextOffset += 20;
Sha1.hash($h, secondParentStart, secondParentEnd, $table.hashes8, secondParentPointer);
log(hexHash($table.hashes8, secondParentPointer));
//=> 06d3749d842b0a2f56f5368932fd616f89f7cf58
commitObject.mergeParent = {pointer: secondParentPointer};
commitObject.committerTime = 1454897681000;
commitObject.committerName = 'snakes';
var mergeCommitRange = CommitFile.create(commitObject, []);
var mergeCommitStart = mergeCommitRange[0];
var mergeCommitEnd = mergeCommitRange[1];

log(mergeCommitStart, mergeCommitEnd);
//=> 255 540
log(pretty($fileCache.array, mergeCommitStart, mergeCommitEnd));
//=> commit 274\x00tree 205f6b799e7d5c2524468ca006a0131aa57ecce7
//=> parent 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
//=> parent 06d3749d842b0a2f56f5368932fd616f89f7cf58
//=> author Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=> committer snakes <jake@jakesandlund.com> 1454897681 -0600
//=>
//=> Foo commit
//=>

nParents = CommitFile.parseParents($fileCache.array, mergeCommitStart, mergeCommitEnd, $h, parentHashesOffset);
log(nParents);
//=> 2
log(hexHash($h, parentHashesOffset));
//=> 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
log(hexHash($h, parentHashesOffset + 20));
//=> 06d3749d842b0a2f56f5368932fd616f89f7cf58
