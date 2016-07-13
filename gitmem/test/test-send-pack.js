'use strict';
require('../../test/helper');

global.$file = new Uint8Array(512);
global.$pack = new Uint8Array(1024);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(32, Random.create(28757772));
global.$mold = Mold.create(8, 512);

Constants.initialize(-1, 1);
Commit.initialize();

log(SendPack.postPath);
//=> /git-receive-pack
log(SendPack.postContentType);
//=> application/x-git-receive-pack-request

var tree = createZero({
    bar: hash('bar'),
    foo: hash('foo'),
});

var user = set($[Commit.User.zero],
               Commit.User.email, hash('jake@jakesandlund.com'),
               Commit.User.timezoneOffset, hash(360),
               Commit.User.name, hash('Jake Sandlund'));

var info = set($[Commit.Info.zero],
               Commit.Info.author, user,
               Commit.Info.committer, user);

var commitPointer = createCommit($[Commit.zero],
        Commit.message, hash('My test commit'),
        Commit.committerTime, 1463772798,
        Commit.tree, tree,
        Commit.info, info,
        Commit.parent, 0);
log(hexHash($table.hashes8, commitPointer));
//=> 060699f289dd37f29a4ced62d2da9fed169fed74

var branch = 'refs/heads/master';

var packLength = Pack.create(commitPointer);
log(packLength);
//=> 256
log(hex($pack, 0, packLength));
//=> 5041434b00000002000000049c0b789c9d8c4b0ac2301040f739c55c4049269fc98014d7822b4f903653fcb58576baf0f656f4046e1ebcb7783a8b4045c49691fae8257071c839f56d28543275d1310689ceb76ccaaad769865379085cca589feb58e170dff4f8c1f24bfb6e1a1a7021792224ceb0b3c95ab3d5e1a62a7f0fccf9052a8bc2f7f40648303a43ae03789c33343030333151484a2c62d8ba3274b1e82bd18d71fa070d8476263f5c6bc6a56f08914ecbcf67b8125ef4f868746690e92fb5fcb28cdd5df7b7c5360100b567189234789c534a4a2c020002e6015834789c534acbcf0700030b0167617cf2413598024ef7fd549cfecf2d6135c771a9

// Delete branch
var body = SendPack.postBody(branch, commitPointer, $[Constants.zeroHash], 0);
log(pretty(body));
//=> 008a060699f289dd37f29a4ced62d2da9fed169fed74 0000000000000000000000000000000000000000 refs/heads/master\x00 report-status agent=gitmem/0.0.0
//=> 0000

// Create branch
body = SendPack.postBody(branch, $[Constants.zeroHash], commitPointer, packLength);
log(pretty(body, 0, 175));
//=> 008a0000000000000000000000000000000000000000 060699f289dd37f29a4ced62d2da9fed169fed74 refs/heads/master\x00 report-status agent=gitmem/0.0.0
//=> 0000PACK\x00\x00\x00\x02\x00\x00\x00\x04\x9c\x0bx\x9c\x9d\x8cK
//=> \xc20\x10@\xf79\xc5\@I\x26\x9f\xc9
log(hex(body, 370));
//=> cbcf0700030b0167617cf2413598024ef7fd549cfecf2d6135c771a9
