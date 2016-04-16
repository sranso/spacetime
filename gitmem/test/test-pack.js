'use strict';
require('../../test/helper');

global.$Heap = Heap.create(512);
global.$ = $Heap.array;

var blobRange = Blob.create('foo bar\n', []);
var blobStart = blobRange[0];
var blobEnd = blobRange[1];
var blob = $.subarray(blobStart, blobEnd);

var packData = PackData.create(32);
var offset = PackData.packFile(packData, blobStart, blobEnd);
log(hex(packData.array, offset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4

var nFiles = 1;
pack = Pack.create(nFiles, packData);
log(hex(pack));
//=> 5041434b000000020000000138789c4bcbcf57484a2ce202000d1402a4f6fdeefeaef7945dd30750fbcb3c45a6a163f183








// Reconstructing actual git commit push
var offsets = {};
var tree = Tree.createSkeleton(offsets, {
    'foobar.txt': 'blob',
});
Sha1.hash(blob, tree, offsets['foobar.txt']);

var treeHash = new Uint8Array(20);
Sha1.hash(tree, treeHash, 0);
log(hex(treeHash));
//=> 792e608d5b9141ebced75e4c7d91f2fc4f9da8b3

var author = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    time: 1454213963000,
    timezoneOffset: 360,
};

var commitObject = {
    tree: {hash: treeHash, hashOffset: 0},
    parents: [],
    committer: author,
    author: author,
    message: 'Initial commit\n',
};

var commit = CommitFile.create(commitObject);
var commitHash = new Uint8Array(20);
Sha1.hash(commit, commitHash, 0);
log(hex(commitHash));
//=> 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf

pack = Pack.create([commit, tree, blob]);
log(hex(pack));
//=> 5041434b00000002000000039d0b789c9d8c4b0ac2301400f739c5bb80927f1a90e256b79ee025ef05a36d0a35bdbf153d819b8199c5f4951942d4ece5402e456515a7cc141cdb1c28aaa24bb625120ec908dcfa7d59e18a4f861b369ab646707aec7afee0f54bc7bccc2328ebac56267a0307e9a5147b9d6beffcf7405c5aed1527f89ec41b30b73b78a602789c3334303033315148cbcf4f4a2cd22ba92861b856facbe5291bdba9e5ac87bff43ed0f9a879fce722000f8b111338789c4bcbcf57484a2ce202000d1402a48eaa2ed0693571e022227e5d5ae5f5d4df1ac88d








log(Pack.validate(pack));
//=> null

log(Pack.validate(new Uint8Array(21)));
//=> pack length is too short

pack[0] = 'N'.charCodeAt(0);
log(Pack.validate(pack));
//=> incorrect pack prefix
pack[0] = 'P'.charCodeAt(0);

pack[7] = 5;
log(Pack.validate(pack));
//=> unsupported pack version number (not 2)
pack[7] = 2;

pack[pack.length - 1] = 0;
log(Pack.validate(pack));
//=> incorrect pack hash
