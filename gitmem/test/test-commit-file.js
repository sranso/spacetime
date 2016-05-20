'use strict';
require('../../test/helper');

global.$file = new Uint8Array(512);
global.$table = {hashes8: new Uint8Array(128)};
var hashesNextOffset = 4;

log(CommitFile.timezoneString(360));
//=> -0600

log(CommitFile.timezoneString(-90));
//=> +0130

// Recreate a real commit.

var blobLength = Blob.create('foo\n');
var blobHash = new Uint8Array(20);
Sha1.hash($file, 0, blobLength, blobHash, 0);

var treeLength = Tree.create({
    foo: 'blob',
});
var fooOffset = $file.indexOf(0, 10) + 1;
Tree.setHash($file, fooOffset, blobHash, 0);
var treeHash = new Uint8Array(20);
var treePointer = hashesNextOffset;
hashesNextOffset += 20;
Sha1.hash($file, 0, treeLength, $table.hashes8, treePointer);
log(hexHash($table.hashes8, treePointer));
//=> 205f6b799e7d5c2524468ca006a0131aa57ecce7

var parentHash = new Uint8Array([0x4e,0x72,0x11,0x0c,0xbb,0x91,0xdd,0x87,0xf7,0xb7,0xee,0xa2,0x2f,0x5f,0x0b,0xcb,0x23,0x3e,0x95,0xbf]);
var parentPointer = hashesNextOffset;
hashesNextOffset += 20;
Convert.arrayToExistingArray($table.hashes8, parentPointer, parentHash);

var commitObject = {
    tree: treePointer,
    parent: parentPointer,
    mergeParent: 0,

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

var commitLength = CommitFile.create(commitObject);

log(pretty($file, 0, commitLength));
//=> commit 233\x00tree 205f6b799e7d5c2524468ca006a0131aa57ecce7
//=> parent 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
//=> author Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=>
//=> Foo commit
//=>

var commitHash = new Uint8Array(20);
Sha1.hash($file, 0, commitLength, commitHash, 0);
log(hexHash(commitHash, 0));
//=> dbcb62b19db062d928144514502df45e86d91eac

var parsedTreeHash = new Uint8Array(20);
CommitFile.parseTree($file, 0, commitLength, parsedTreeHash, 0);
log(hexHash(parsedTreeHash, 0));
//=> 205f6b799e7d5c2524468ca006a0131aa57ecce7

var parentHashes = new Uint8Array(2 * 20);
var nParents = CommitFile.parseParents($file, 0, commitLength, parentHashes, 0);
log(nParents, hexHash(parentHashes, 0));
//=> 1 '4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf'

var gotCommit = {};
CommitFile.parse($file, 0, commitLength, gotCommit);
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








var secondParent = Convert.stringToArray('secondParent');
var secondParentPointer = hashesNextOffset;
hashesNextOffset += 20;
Sha1.hash(secondParent, 0, secondParent.length, $table.hashes8, secondParentPointer);
log(hexHash($table.hashes8, secondParentPointer));
//=> 06d3749d842b0a2f56f5368932fd616f89f7cf58
commitObject.mergeParent = secondParentPointer;
commitObject.committerTime = 1454897681000;
commitObject.committerName = 'snakes';
var mergeCommitLength = CommitFile.create(commitObject);

log(pretty($file, 0, mergeCommitLength));
//=> commit 274\x00tree 205f6b799e7d5c2524468ca006a0131aa57ecce7
//=> parent 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
//=> parent 06d3749d842b0a2f56f5368932fd616f89f7cf58
//=> author Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=> committer snakes <jake@jakesandlund.com> 1454897681 -0600
//=>
//=> Foo commit
//=>

nParents = CommitFile.parseParents($file, 0, mergeCommitLength, parentHashes, 0);
log(nParents);
//=> 2
log(hexHash(parentHashes, 0));
//=> 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
log(hexHash(parentHashes, 20));
//=> 06d3749d842b0a2f56f5368932fd616f89f7cf58
