'use strict';
require('../../test/helper');

global.$table = Table.create(32, Random.create(73440121));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(8, 1024);

Constants.initialize();
Commit.initialize();

log(CommitFile.timezoneString(360));
//=> -0600

log(CommitFile.timezoneString(-90));
//=> +0130

var tree = createDefaults({
    bar: hash('bar'),
    foo: hash('foo'),
});
log(hexHash($table.hashes8, tree));
//=> d222b927f53e49a12986fb4a7a87c51924e513b9

var user = set(Commit.User.defaults,
               Commit.User.email, hash('jake@jakesandlund.com'),
               Commit.User.timezoneOffset, hash(360),
               Commit.User.name, hash('Jake Sandlund'));

var info = set(Commit.Info.defaults,
               Commit.Info.author, user,
               Commit.Info.committer, user);

var parentCommit = Commit.defaults;
log(hexHash($table.hashes8, parentCommit));
//=> efdf2abb9ec81070fbbeb01f691aa9a54d60a0f3

var data32 = new Uint32Array(5);
data32[Commit.message] = hash("My test commit");
data32[Commit.committerTime] = hash(1463772798);
data32[Commit.tree] = tree;
data32[Commit.info] = info;
data32[Commit.parent] = parentCommit;

var commitLength = CommitFile.create(data32, 0);
log(pretty($file, 0, commitLength));
//=> commit 236\x00tree d222b927f53e49a12986fb4a7a87c51924e513b9
//=> parent efdf2abb9ec81070fbbeb01f691aa9a54d60a0f3
//=> author Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=>
//=> My test commit

var commitHash = new Uint8Array(20);
Sha1.hash($file, 0, commitLength, commitHash, 0);
log(hexHash(commitHash, 0));
//=> 63020ad316949de76b718821be2f504c2bf4c706

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
