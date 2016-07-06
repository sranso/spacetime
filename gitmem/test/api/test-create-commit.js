'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(32, Random.create(28591));
global.$mold = Mold.create(8, 512);

Constants.initialize(-1, 1);
Commit.initialize();

var tree = createZero({
    bar: hash('bar'),
    foo: hash('foo'),
});
log(hexHash($table.hashes8, tree));
//=> d222b927f53e49a12986fb4a7a87c51924e513b9

var user = set($[Commit.User.zero],
               Commit.User.email, hash('jake@jakesandlund.com'),
               Commit.User.timezoneOffset, hash(360),
               Commit.User.name, hash('Jake Sandlund'));

var info = set($[Commit.Info.zero],
               Commit.Info.author, user,
               Commit.Info.committer, user);

var pointer = createCommit($[Commit.zero],
                           Commit.message, hash('My test commit'),
                           Commit.committerTime, hash(1463772798),
                           Commit.tree, tree,
                           Commit.info, info,
                           Commit.parent, $[Commit.zero]);

log(hexHash($table.hashes8, pointer));
//=> 3368ce02c06b1bc2cfe8902ff9c8226953263986
log(pretty($file, 0, 247));
//=> commit 236\x00tree d222b927f53e49a12986fb4a7a87c51924e513b9
//=> parent cf2f19e7e3692eadb7e6e9e37f63d29f8b5ced7c
//=> author Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1463772798 -0600
//=>
//=> My test commit
log(val(get(pointer, Commit.message)));
//=> My test commit
log(val(get(pointer, Commit.committerTime)));
//=> 1463772798
log(val(get(get(pointer, Commit.tree), 0)));
//=> bar
log(val(get(get(pointer, Commit.parent), Commit.committerTime)));
//=> 0
log(val(get(get(get(pointer, Commit.info), Commit.Info.author), Commit.User.email)));
//=> jake@jakesandlund.com
