'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
global.$ = $Heap.array;

log(CommitFile.timezoneString(360));
//=> -0600

log(CommitFile.timezoneString(-90));
//=> +0130

// Recreate a real commit.

var blobRange = Blob.createFromString('foo\n');
var tree = Tree.create({
    foo: 'blob',
});
Sha1.hash($, blobRange[0], blobRange[1], tree.fileStart + tree.offsets.foo);

var treeHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, tree.fileStart, tree.fileEnd, treeHashOffset);
log(hash(treeHashOffset));
//=> 205f6b799e7d5c2524468ca006a0131aa57ecce7

var parentHash = new Uint8Array([0x4e,0x72,0x11,0x0c,0xbb,0x91,0xdd,0x87,0xf7,0xb7,0xee,0xa2,0x2f,0x5f,0x0b,0xcb,0x23,0x3e,0x95,0xbf]);
var parentHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
GitConvert.setHash($, parentHashOffset, parentHash, 0);

var commitObject = {
    tree: {hashOffset: treeHashOffset},
    parents: [{hashOffset: parentHashOffset}],
    committer: {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        time: 1454274859000,
        timezoneOffset: 360,
    },
    author: {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        time: 1454274859000,
        timezoneOffset: 360,
    },
    message: 'Foo commit\n',
};

var commitRange = CommitFile.createFromObject(commitObject);
var commitStart = commitRange[0];
var commitEnd = commitRange[1];

log(pretty(commitStart, commitEnd));
//=> commit 233\x00tree 205f6b799e7d5c2524468ca006a0131aa57ecce7
//=> parent 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
//=> author Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=>
//=> Foo commit
//=>

var commitHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, commitStart, commitEnd, commitHashOffset);
log(hash(commitHashOffset));
//=> dbcb62b19db062d928144514502df45e86d91eac

treeHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
CommitFile.parseTree(commitStart, commitEnd, treeHashOffset);
log(hash(treeHashOffset));
//=> 205f6b799e7d5c2524468ca006a0131aa57ecce7

var parentHashesOffset = $Heap.nextOffset;
$Heap.nextOffset += 3 * 20;
var nParents = CommitFile.parseParents(commitStart, commitEnd, parentHashesOffset);
log(nParents, hash(parentHashesOffset));
//=> 1 '4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf'

var gotAuthor = CommitFile.parseAuthor(commitStart, commitEnd);
log(gotAuthor);
//=> { name: 'Jake Sandlund',
//=>   email: 'jake@jakesandlund.com',
//=>   time: 1454274859000,
//=>   timezoneOffset: 360 }

var secondParentString = 'secondParent';
var secondParentOffset = $Heap.nextOffset;
$Heap.nextOffset += secondParentString.length;
GitConvert.stringToExistingArray($, secondParentOffset, secondParentString);
var secondParentHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, secondParentOffset, secondParentHashOffset, secondParentHashOffset);
commitObject.parents.push({hashOffset: secondParentHashOffset});
commitObject.committer.time = 1454897681000;
commitObject.committer.name = 'snakes';
var mergeCommitRange = CommitFile.createFromObject(commitObject);
var mergeCommitStart = mergeCommitRange[0];
var mergeCommitEnd = mergeCommitRange[1];

log(pretty(mergeCommitStart, mergeCommitEnd));
//=> commit 274\x00tree 205f6b799e7d5c2524468ca006a0131aa57ecce7
//=> parent 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
//=> parent 06d3749d842b0a2f56f5368932fd616f89f7cf58
//=> author Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=> committer snakes <jake@jakesandlund.com> 1454897681 -0600
//=>
//=> Foo commit
//=>

nParents = CommitFile.parseParents(mergeCommitStart, mergeCommitEnd, parentHashesOffset);
log(nParents);
//=> 2
log(hash(parentHashesOffset));
//=> 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
log(hash(parentHashesOffset + 20));
//=> 06d3749d842b0a2f56f5368932fd616f89f7cf58

var gotCommitter = CommitFile.parseCommitter(mergeCommitStart, mergeCommitEnd);
log(gotCommitter);
//=> { name: 'snakes',
//=>   email: 'jake@jakesandlund.com',
//=>   time: 1454897681000,
//=>   timezoneOffset: 360 }

var gotMessage = CommitFile.parseMessage(mergeCommitStart, mergeCommitEnd);
log(gotMessage);
//=> Foo commit
//=>
