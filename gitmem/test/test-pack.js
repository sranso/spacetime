'use strict';
require('../../test/helper');

global.$table = Table.create(32, Random.create(6889162));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(8, 512);
global.$pack = new Uint8Array(256);

Constants.initialize();
Commit.initialize();

var foo1 = hash('foo');
var foo1Hash = $table.hashes8.slice(foo1, foo1 + 20);
var bar1 = hash('bar');
var bar1Hash = $table.hashes8.slice(bar1, bar1 + 20);
log(hexHash($table.hashes8, foo1));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82

var tree1 = createZero({
    bar: bar1,
    foo: foo1,
});
var tree1Hash = $table.hashes8.slice(tree1, tree1 + 20);
log(hexHash($table.hashes8, tree1));
//=> d222b927f53e49a12986fb4a7a87c51924e513b9

var user = set(Commit.User.zero,
               Commit.User.email, hash('jake@jakesandlund.com'),
               Commit.User.timezoneOffset, hash(360),
               Commit.User.name, hash('Jake Sandlund'));

var info = set(Commit.Info.zero,
               Commit.Info.author, user,
               Commit.Info.committer, user);

var commit1 = commit(Commit.zero,
                     Commit.message, hash('My test commit'),
                     Commit.committerTime, hash(1463772798),
                     Commit.tree, tree1,
                     Commit.info, info,
                     Commit.parent, Commit.zero);
var commit1Hash = $table.hashes8.slice(commit1, commit1 + 20);
log(hexHash($table.hashes8, commit1));
//=> 63020ad316949de76b718821be2f504c2bf4c706

var foo2 = hash('FOO');
var foo2Hash = $table.hashes8.slice(foo2, foo2 + 20);
var bar2 = hash('BAR');
var bar2Hash = $table.hashes8.slice(bar2, bar2 + 20);
log(hexHash($table.hashes8, bar2));
//=> a8ff268fe0e83bb3bac4a980c63d149374b6fa1e

var tree2 = set(tree1,
                0, bar2,
                1, foo2);
var tree2Hash = $table.hashes8.slice(tree2, tree2 + 20);
log(hexHash($table.hashes8, tree2));
//=> 3f05d6879091601c20790de178067ecf33134c48

var commit2 = commit(Commit.zero,
                     Commit.message, hash('My second commit'),
                     Commit.committerTime, hash(1463930072),
                     Commit.tree, tree2,
                     Commit.info, info,
                     Commit.parent, commit1);
var commit2Hash = $table.hashes8.slice(commit2, commit2 + 20);
log(hexHash($table.hashes8, commit2));
//=> f1cdfd6a34ba453d4a5b45d090b21a3a0fd72a5b

$table.data8[Table.typeOffset(Commit.zero)] |= Type.onServer;

var packLength = Pack.create(commit2);
log(packLength);
//=> 538
var numFiles = $pack[11];
log(numFiles);
//=> 8
log(hex($pack, 0, packLength));
//=> 5041434b00000002000000089e0e789c9d8c4d0ac2301085f739c55c409964d2490222ae05579e204d26f8d756da74e1ed8de809dc3cdefbe07d7516012ad865f62e60d08c3a196c358b761ed9492a449a6cb25e3de32c630526341833690e366471dc3bedbdd1bd98d2a14da62f36396415d77a996638c6bbc0398ef9b18e1976b7360f9f587e689ba6610fda320542740636c888aad1e15aabfc2d50a7172c92a6f6f9bade2bce4752ae03789c33343030333151484a2c6258f15fadffc10bebcdbb8eac6c38662b32b964db2f394388745a7e3e83c6ddcc24add8e3abecaebdb82539afcc4065b5632c0021671a2534789c5372720c0200022600f834789c5372f3f70700024b01079c0e789c9d8c390ec23010007bbf623f00b2d7e74a08512351f18275bc165712943805bf27085e4033d24c316d128182889930566fc5111ba4146a761c39c5ce1b4227ded84ceac9930c0da4968a9c3349978c8ebae62c599b1ac830137b5782665dade2a55dc6098e7c1738f3501ecb5060775bf5f0c1fc4bdb6eecf7605cb03162a4041b1db4566bedafadc9df03757a4193b9c1f7f40643fe48f5ae03789c33343030333151484a2c62d8ba3274b1e82bd18d71fa070d8476263f5c6bc6a56f08914ecbcf67b8125ef4f868746690e92fb5fcb28cdd5df7b7c5360100b567189234789c534a4a2c020002e6015834789c534acbcf0700030b016790919f4faebe1f68d930e1dd094502d15f402dcb
log($table.data8[Table.typeOffset(commit2)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(commit1)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(foo1)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(bar2)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(tree1)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(tree2)] & Type.onServer);
//=> 128


global.$table = Table.create(32, Random.create(622009831));
Constants.initialize();
Commit.initialize();

Unpack.unpack($pack);

commit2 = Table.findPointer($table, commit2Hash, 0);
log(hexHash($table.hashes8, commit2));
//=> f1cdfd6a34ba453d4a5b45d090b21a3a0fd72a5b
log(val(get(commit2, Commit.message)));
//=> My second commit
log(val(get(get(get(commit2, Commit.info), Commit.Info.author), Commit.User.timezoneOffset)));
//=> 360

commit1 = Table.findPointer($table, commit1Hash, 0);
log(hexHash($table.hashes8, commit1));
//=> 63020ad316949de76b718821be2f504c2bf4c706
log(val(get(commit1, Commit.message)));
//=> My test commit
log(val(get(get(get(commit1, Commit.info), Commit.Info.author), Commit.User.timezoneOffset)));
//=> 360

tree2 = Table.findPointer($table, tree2Hash, 0);
log(hexHash($table.hashes8, tree2));
//=> 3f05d6879091601c20790de178067ecf33134c48
log(val(get(tree2, 1))); // foo
//=> FOO

tree1 = Table.findPointer($table, tree1Hash, 0);
log(hexHash($table.hashes8, tree1));
//=> d222b927f53e49a12986fb4a7a87c51924e513b9
log(val(get(tree1, 0))); // bar
//=> bar

bar2 = Table.findPointer($table, bar2Hash, 0);
log(hexHash($table.hashes8, bar2));
//=> a8ff268fe0e83bb3bac4a980c63d149374b6fa1e
log(val(bar2));
//=> BAR

foo1 = Table.findPointer($table, foo1Hash, 0);
log(hexHash($table.hashes8, foo1));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82
log(val(foo1));
//=> foo





global.$pack = $pack.subarray(0, packLength);
log(Pack.validate($pack));
//=> null

log(Pack.validate(new Uint8Array(21)));
//=> Pack length is too short

$pack[0] = 'N'.charCodeAt(0);
log(Pack.validate($pack));
//=> Incorrect pack prefix
$pack[0] = 'P'.charCodeAt(0);

$pack[7] = 5;
log(Pack.validate($pack));
//=> Unsupported pack version number (not 2)
$pack[7] = 2;

$pack[$pack.length - 1] = 0;
log(Pack.validate($pack));
//=> Incorrect pack hash
