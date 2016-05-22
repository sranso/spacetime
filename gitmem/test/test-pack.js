'use strict';
require('../../test/helper');

global.$table = Table.create(32, Random.create(6889162));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(8, 512);
global.$pack = new Uint8Array(256);

Constants.initialize(-1, 1);
Commit.initialize();

var foo = hash('foo');
var fooHash = $table.hashes8.slice(foo, foo + 20);
log(hexHash($table.hashes8, foo));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82
var bar = hash('bar');
var barHash = $table.hashes8.slice(bar, bar + 20);
log(hexHash($table.hashes8, bar));
//=> b5a955a315ea15b15e2fc13012b963e1ad360a2f

var tree1 = createZero({
    bar: bar,
    foo: foo,
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
//=> 3368ce02c06b1bc2cfe8902ff9c8226953263986

var tree2 = Constants.emptyTree;
var tree2Hash = $table.hashes8.slice(tree2, tree2 + 20);
log(hexHash($table.hashes8, tree2));
//=> eb3c1ec5e288babdc43edd0205033f2a14bb4c1b

var commit2 = commit(Commit.zero,
                     Commit.message, hash('My second commit'),
                     Commit.committerTime, hash(1463930072),
                     Commit.tree, tree2,
                     Commit.info, info,
                     Commit.parent, commit1);
var commit2Hash = $table.hashes8.slice(commit2, commit2 + 20);
log(hexHash($table.hashes8, commit2));
//=> e6e4af78071e9a4ded7e7dfb2513722688e8b663

$table.data8[Table.typeOffset(Commit.zero)] |= Type.onServer;

var packLength = Pack.create(commit2);
log(packLength);
//=> 498
var numFiles = $pack[11];
log(numFiles);
//=> 7
log(hex($pack, 0, packLength));
//=> 5041434b00000002000000079e0e789c9d8c4d0ac2301046f73d452ea04c66d29880886bc19527c84c26f8d756dab8f0f646f4046e3ef81ebc576755a34c62557ac510387116479a3320f440543059c7ecc472f748b38ed510f9200a28e0d9b2a0140d11b0942801d1c79ed0530cbe4bcf7a9e6673483735a734e6fb73cc667b6d77ff99e587d6320d3b635d9308608366051ea06b74b8d4aa7f07bae3cb2c2a5373bead37e4004949a202789c33343030333151d04bcd2d28a964989b31d9c6e5a365ebced792a27397bdb6fff0b4643f00cd3a0ebb31789c530200002300239c0e789c9d8e3b0ec23010057b9fc21700c5ebcf7a2584a891a838c1da5e8b5f12943805b727204e40f3a49962f4da24a20b002402acde8a23364031d4e4183962f686c0893736917af22443d3b94235242836100897841284c4620db600d5987c968259f1d22ee3a48f7c177de6a13c96a1e8dd6dc5c367e69fdae6b1df6be3824504a4a8375de83ab5dafeda9afc1d50a7976e32af87bfa53739b148fbae03789c33343030333151484a2c62d8ba3274b1e82bd18d71fa070d8476263f5c6bc6a56f08914ecbcf67b8125ef4f868746690e92fb5fcb28cdd5df7b7c5360100b567189234789c534a4a2c020002e6015834789c534acbcf0700030b01678de7aa72fd2bf50974c92b7139810bb5db01f997
log($table.data8[Table.typeOffset(commit2)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(commit1)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(foo)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(bar)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(tree1)] & Type.onServer);
//=> 128
log($table.data8[Table.typeOffset(tree2)] & Type.onServer);
//=> 128


global.$table = Table.create(32, Random.create(622009831));
Constants.initialize(-1, 1);
Commit.initialize();

Unpack.unpack($pack);

commit2 = Table.findPointer($table, commit2Hash, 0);
log($table.data8[Table.typeOffset(commit2)] & Type.onServer);
//=> 128
log(hexHash($table.hashes8, commit2));
//=> e6e4af78071e9a4ded7e7dfb2513722688e8b663
log(val(get(commit2, Commit.message)));
//=> My second commit
log(val(get(get(get(commit2, Commit.info), Commit.Info.author), Commit.User.timezoneOffset)));
//=> 360

commit1 = Table.findPointer($table, commit1Hash, 0);
log(hexHash($table.hashes8, commit1));
//=> 3368ce02c06b1bc2cfe8902ff9c8226953263986
log(val(get(commit1, Commit.message)));
//=> My test commit
log(val(get(get(get(commit1, Commit.info), Commit.Info.author), Commit.User.timezoneOffset)));
//=> 360

tree2 = Table.findPointer($table, tree2Hash, 0);
log($table.data8[Table.typeOffset(tree2)] & Type.onServer);
//=> 128
log(hexHash($table.hashes8, tree2));
//=> eb3c1ec5e288babdc43edd0205033f2a14bb4c1b
var empty = get(tree2, 0); // .empty
log($table.data8[Table.typeOffset(empty)] & Type.onServer);
//=> 128
log(empty, Constants.emptyString);
//=> 260 260

tree1 = Table.findPointer($table, tree1Hash, 0);
log(hexHash($table.hashes8, tree1));
//=> d222b927f53e49a12986fb4a7a87c51924e513b9
log(val(get(tree1, 0))); // bar
//=> bar

bar = Table.findPointer($table, barHash, 0);
log($table.data8[Table.typeOffset(bar)] & Type.onServer);
//=> 128
log(hexHash($table.hashes8, bar));
//=> b5a955a315ea15b15e2fc13012b963e1ad360a2f
log(val(bar));
//=> bar

foo = Table.findPointer($table, fooHash, 0);
log(hexHash($table.hashes8, foo));
//=> d45772e3c55b695235fa266f7668bb8adfb65d82
log(val(foo));
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
