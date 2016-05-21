'use strict';
require('../../test/helper');

global.$table = Table.create(32, Random.create(73440121));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(8, 512);

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

var message = hash("My test commit");
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
//=> parent efdf2abb9ec81070fbbeb01f691aa9a54d60a0f3
//=> author Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=>
//=> My test commit

var commitHash = new Uint8Array(20);
Sha1.hash($file, 0, commitLength, commitHash, 0);
log(hexHash(commitHash, 0));
//=> 63020ad316949de76b718821be2f504c2bf4c706



data32 = new Uint32Array(5);
global.$table = Table.create(32, Random.create(73440121));
var oldFile = $file;
global.$file = new Uint8Array(256);
Constants.initialize();
Commit.initialize();
global.$file = oldFile;

CommitFile.unpack(commitLength, data32, 0);

log(val(data32[Commit.message]));
//=> My test commit
log(val(data32[Commit.committerTime]));
//=> 1463772798
log($table.data8[Table.typeOffset(data32[Commit.tree])], Type.pending);
//=> 1 1
var tree = createDefaults({
    bar: hash('bar'),
    foo: hash('foo'),
});
log(data32[Commit.tree], tree);
//=> 428 428
log(data32[Commit.parent], Commit.defaults);
//=> 324 324
log(val(get(get(data32[Commit.info], Commit.Info.author), Commit.User.name)));
//=> Jake Sandlund
