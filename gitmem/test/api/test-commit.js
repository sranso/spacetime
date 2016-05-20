'use strict';
require('../../../test/helper');

global.$table = Table.create(32, Random.create(28591));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(8, 1024);

Constants.initialize();
Commit.initialize();

log(val(get(Commit.User.defaults, Commit.User.email)));
//=> test@example.com
log(val(get(Commit.User.defaults, Commit.User.name)));
//=> User Name
log(get(Commit.User.defaults, Commit.User.timezoneOffset), hash(360));
//=> 388 44
log(val(get(Commit.User.defaults, Commit.User.timezoneOffset)));
//=> 0

log(get(Commit.Info.defaults, Commit.Info.author), Commit.User.defaults);
//=> 580 580
log(get(Commit.Info.defaults, Commit.Info.committer), Commit.User.defaults);
//=> 580 580
log(val(get(Commit.Info.defaults, Commit.Info.authorTime)));
//=> 0

log($table.data8[Table.typeOffset(Commit.defaults)], Type.commit);
//=> 2 2
log(val(get(Commit.defaults, Commit.committerTime)));
//=> 0
log(get(Commit.defaults, Commit.info), Commit.Info.defaults);
//=> 108 108
log(val(get(Commit.defaults, Commit.message)));
//=> Commit message
log(get(Commit.defaults, Commit.parent));
//=> 0
log(get(Commit.defaults, Commit.tree), Constants.emptyTree);
//=> 196 196


var projectDefaults = createDefaults({
    bar: hash('bar'),
    foo: hash('foo'),
});

var user = set(Commit.User.defaults,
               Commit.User.email, hash('jake@jakesandlund.c'),
               Commit.User.timezoneOffset, hash(360),
               Commit.User.name, hash('Jake Sandlund'));

var info = set(Commit.Info.defaults,
               Commit.Info.author, user,
               Commit.Info.committer, user);

var pointer = commit(Commit.defaults,
                     Commit.message, hash("My test commit"),
                     Commit.committerTime, hash(1463772798),
                     Commit.tree, projectDefaults,
                     Commit.info, info,
                     Commit.parent, Commit.defaults);

log(hexHash($table.hashes8, pointer));
//=> 882c785c4e2728853f223038dc77dd9cc9b68ca5
log(pretty($file, 0, 237));
//=> commit 226\x00tree d222b927f53e49a12986fb4a7a87c51924e513b9
//=> parent efdf2abb9ec81070fbbeb01f691aa9a54d60a0f3
//=> author Jake Sandlund <jake@jakesandlund.c> 1463772 -0600
//=> committer Jake Sandlund <jake@jakesandlund.c> 1463772 -0600
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
//=> jake@jakesandlund.c
