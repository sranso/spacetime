'use strict';
require('../../../test/helper');

global.$table = Table.create(32, Random.create(28591));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(8, 512);

Constants.initialize(-1, 1);
Commit.initialize();

log(hexHash($table.hashes8, Commit.zero));
//=> cf2f19e7e3692eadb7e6e9e37f63d29f8b5ced7c
var email = val(get(Commit.User.zero, Commit.User.email));
log(email.length, typeof email);
//=> 0 'string'
var name = val(get(Commit.User.zero, Commit.User.name));
log(name.length, typeof name);
//=> 0 'string'
log(get(Commit.User.zero, Commit.User.timezoneOffset), hash(360));
//=> 388 4
log(val(get(Commit.User.zero, Commit.User.timezoneOffset)));
//=> 0

log(get(Commit.Info.zero, Commit.Info.author), Commit.User.zero);
//=> 280 280
log(get(Commit.Info.zero, Commit.Info.committer), Commit.User.zero);
//=> 280 280
log(val(get(Commit.Info.zero, Commit.Info.authorTime)));
//=> 0

log($table.data8[Table.typeOffset(Commit.zero)], Type.commit);
//=> 2 2
log(val(get(Commit.zero, Commit.committerTime)));
//=> 0
log(get(Commit.zero, Commit.info), Commit.Info.zero);
//=> 324 324
var message = val(get(Commit.zero, Commit.message));
log(message.length, typeof message);
//=> 0 'string'
log(get(Commit.zero, Commit.parent));
//=> 0
log(get(Commit.zero, Commit.tree), Constants.emptyTree);
//=> 196 196


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

var pointer = commit(Commit.zero,
                     Commit.message, hash('My test commit'),
                     Commit.committerTime, hash(1463772798),
                     Commit.tree, tree,
                     Commit.info, info,
                     Commit.parent, Commit.zero);

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
