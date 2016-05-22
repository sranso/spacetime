'use strict';
require('../../../test/helper');

global.$table = Table.create(32, Random.create(28591));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(8, 512);

Constants.initialize();
Commit.initialize();

log(val(get(Commit.User.zero, Commit.User.email)));
//=> test@example.com
log(val(get(Commit.User.zero, Commit.User.name)));
//=> User Name
log(get(Commit.User.zero, Commit.User.timezoneOffset), hash(360));
//=> 388 44
log(val(get(Commit.User.zero, Commit.User.timezoneOffset)));
//=> 0

log(get(Commit.Info.zero, Commit.Info.author), Commit.User.zero);
//=> 580 580
log(get(Commit.Info.zero, Commit.Info.committer), Commit.User.zero);
//=> 580 580
log(val(get(Commit.Info.zero, Commit.Info.authorTime)));
//=> 0

log($table.data8[Table.typeOffset(Commit.zero)], Type.commit);
//=> 2 2
log(val(get(Commit.zero, Commit.committerTime)));
//=> 0
log(get(Commit.zero, Commit.info), Commit.Info.zero);
//=> 108 108
log(val(get(Commit.zero, Commit.message)));
//=> Commit message
log(get(Commit.zero, Commit.parent));
//=> 0
log(get(Commit.zero, Commit.tree), Constants.emptyTree);
//=> 196 196


var tree = createZero({
    bar: hash('bar'),
    foo: hash('foo'),
});

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
//=> 63020ad316949de76b718821be2f504c2bf4c706
log(pretty($file, 0, 247));
//=> commit 236\x00tree d222b927f53e49a12986fb4a7a87c51924e513b9
//=> parent efdf2abb9ec81070fbbeb01f691aa9a54d60a0f3
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
log(val(get(get(pointer, Commit.parent), Commit.message)));
//=> Commit message
log(val(get(get(get(pointer, Commit.info), Commit.Info.author), Commit.User.email)));
//=> jake@jakesandlund.com
