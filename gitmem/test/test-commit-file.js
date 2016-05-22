'use strict';
require('../../test/helper');

global.$file = new Uint8Array(256);
global.$ = new Uint32Array(32);
$.nextIndex = 0;
global.$table = Table.create(32, Random.create(73440121));
global.$mold = Mold.create(8, 512);

Constants.initialize(-1, 1);
Commit.initialize();

log(CommitFile.timezoneString(360));
//=> -0600

log(CommitFile.timezoneString(-90));
//=> +0130

var tree = createZero({
    bar: hash('bar'),
    foo: hash('foo'),
});
log(hexHash($table.hashes8, tree));
//=> d222b927f53e49a12986fb4a7a87c51924e513b9

var user = set(Commit.User.zero,
               Commit.User.email, hash('jake@jakesandlund.com'),
               Commit.User.timezoneOffset, hash(360),
               Commit.User.name, hash('Jake Sandlund'));

var info = set(Commit.Info.zero,
               Commit.Info.author, user,
               Commit.Info.committer, user);

var parentCommit = Commit.zero;
log(hexHash($table.hashes8, parentCommit));
//=> cf2f19e7e3692eadb7e6e9e37f63d29f8b5ced7c

var message = hash('My test commit');
$table.data8[Table.typeOffset(message)] |= Type.onServer;

var data32 = new Uint32Array(5);
data32[Commit.message] = message;
data32[Commit.committerTime] = hash(1463772798);
data32[Commit.tree] = tree;
data32[Commit.info] = info;
data32[Commit.parent] = parentCommit;

var commitLength = CommitFile.create(data32, 0);
log(pretty($file, 0, commitLength));
//=> commit 236\x00tree d222b927f53e49a12986fb4a7a87c51924e513b9
//=> parent cf2f19e7e3692eadb7e6e9e37f63d29f8b5ced7c
//=> author Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=>
//=> My test commit

var commitHash = new Uint8Array(20);
Sha1.hash($file, 0, commitLength, commitHash, 0);
log(hexHash(commitHash, 0));
//=> 3368ce02c06b1bc2cfe8902ff9c8226953263986



data32 = new Uint32Array(5);
global.$table = Table.create(32, Random.create(73440121));
var oldFile = $file;
global.$file = new Uint8Array(256);
Constants.initialize(-1, 1);
Commit.initialize();
global.$file = oldFile;

CommitFile.unpack(commitLength, data32, 0);

log(val(data32[Commit.message]));
//=> My test commit
log(val(data32[Commit.committerTime]));
//=> 1463772798
log($table.data8[Table.typeOffset(data32[Commit.tree])], Type.pending);
//=> 1 1
var tree = createZero({
    bar: hash('bar'),
    foo: hash('foo'),
});
log(data32[Commit.tree], tree);
//=> 388 388
log(data32[Commit.parent], Commit.zero);
//=> 132 132
log(val(get(get(data32[Commit.info], Commit.Info.author), Commit.User.name)));
//=> Jake Sandlund
