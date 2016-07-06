'use strict';
require('../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(32, Random.create(28591));
global.$mold = Mold.create(8, 512);

Constants.initialize(-1, 1);
Commit.initialize();


log(hexHash($table.hashes8, $[Commit.zero]));
//=> cf2f19e7e3692eadb7e6e9e37f63d29f8b5ced7c
var email = val(get($[Commit.User.zero], Commit.User.email));
log(email.length, typeof email);
//=> 0 'string'
var name = val(get($[Commit.User.zero], Commit.User.name));
log(name.length, typeof name);
//=> 0 'string'
log(get($[Commit.User.zero], Commit.User.timezoneOffset), hash(360));
//=> 388 24
log(val(get($[Commit.User.zero], Commit.User.timezoneOffset)));
//=> 0

log(get($[Commit.Info.zero], Commit.Info.author), $[Commit.User.zero]);
//=> 280 280
log(get($[Commit.Info.zero], Commit.Info.committer), $[Commit.User.zero]);
//=> 280 280
log(val(get($[Commit.Info.zero], Commit.Info.authorTime)));
//=> 0

log($table.data8[Table.typeOffset($[Commit.zero])], Type.commit);
//=> 2 2
log(val(get($[Commit.zero], Commit.committerTime)));
//=> 0
log(get($[Commit.zero], Commit.info), $[Commit.Info.zero]);
//=> 324 324
var message = val(get($[Commit.zero], Commit.message));
log(message.length, typeof message);
//=> 0 'string'
log(get($[Commit.zero], Commit.parent));
//=> 0
log(get($[Commit.zero], Commit.tree), $[Constants.emptyTree]);
//=> 196 196
