'use strict';
require('../../../test/helper');

global.$table = Table.create(16, Random.create(28591));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(4, 512);

Constants.initialize();
Commit.initialize();

log($table.data8[Table.typeOffset(Commit.User.defaults)], Type.tree);
//=> 8 8
log(val(get(Commit.User.defaults, Commit.User.email)));
//=> test@example.com
log(val(get(Commit.User.defaults, Commit.User.name)));
//=> User Name
log(get(Commit.User.defaults, Commit.User.timezoneOffset), hash(360));
//=> 324 324
log(val(get(Commit.User.defaults, Commit.User.timezoneOffset)));
//=> 360

log($table.data8[Table.typeOffset(Commit.Info.defaults)], Type.tree);
//=> 8 8
log(get(Commit.Info.defaults, Commit.Info.author), Commit.User.defaults);
//=> 88 88
log(get(Commit.Info.defaults, Commit.Info.committer), Commit.User.defaults);
//=> 88 88
log(val(get(Commit.Info.defaults, Commit.Info.authorTime)));
//=> 0

log($table.data8[Table.typeOffset(Commit.defaults)], Type.commit);
//=> 2 2
log(val(get(Commit.defaults, Commit.committerTime)));
//=> 0
log(get(Commit.defaults, Commit.info), Commit.Info.defaults);
//=> 260 260
log(val(get(Commit.defaults, Commit.message)));
//=> Commit message
log(get(Commit.defaults, Commit.parent));
//=> 0
log(get(Commit.defaults, Commit.tree), Constants.emptyTree);
//=> 68 68
