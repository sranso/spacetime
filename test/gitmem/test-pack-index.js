var helper = require('../helper');
var hex = helper.hex;

Random.seed(1);
var hashes = new Uint8Array(100 * 20);
var i;
for (i = 0; i < hashes.length; i++) {
    hashes[i] = Random.rand();
}
var offsets = new Uint32Array(100);
for (i = 0; i < offsets.length; i++) {
    offsets[i] = i;
}
PackIndex._sortHashes(hashes, offsets, 0, 100 - 1);

var lines = [];
for (i = 0; i < 100; i++) {
    lines.push(hex(hashes.subarray(20 * i, 20 * i + 20)) + ' ' + offsets[i]);
}
log(lines.slice(0, 5).join('\n'));
//=> 00d81e8fc45bc727a61fcda7ceb4d4a4d7760861 87
//=> 05b699d0a9132d2b530a57007b1ac7937c059311 35
//=> 05f886ebfbf47adbc455388394c8a44f62642743 38
//=> 070b1eb22ac2e118de036899dd5b1a4f921fd568 98
//=> 0ab69d7dfe60b37b331e6d20216c2e51203209b0 74
log(lines.slice(95).join('\n'));
//=> f87e492ab0786f74cedcd05b94265b7117bfa223 76
//=> fb3197e25b81cc9ef12f2f7c3ab2831344ad5ba5 96
//=> fbf96b679063f9cfefdd0b2fcb2d163ddc1f2de1 47
//=> fd10636bbe3b510d82e4e4d9b12d9a7ec330e9ff 82
//=> fd302b44999dc27111e9d8025246b49815c87f60 97

var blob = Blob.fromString('foo bar\n');

var offsets = {};
var tree = Tree.createSkeleton(offsets, {
    'foobar.txt': 'blob',
});
Sha1.hash(blob, tree, offsets['foobar.txt']);

var treeHash = new Uint8Array(20);
Sha1.hash(tree, treeHash, 0);
log(hex(treeHash));
//=> 792e608d5b9141ebced75e4c7d91f2fc4f9da8b3

var oldGetTimezoneOffset = Date.prototype.getTimezoneOffset;
Date.prototype.getTimezoneOffset = function () {
    return 360;
};

var author = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    date: new Date(1454213963000),
};

var commitObject = {
    tree: treeHash,
    parents: [],
    committer: author,
    author: author,
    message: 'Initial commit\n',
};

var commit = Commit.createFromObject(commitObject);
var commitHash = new Uint8Array(20);
Sha1.hash(commit, commitHash, 0);
log(hex(commitHash));
//=> 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf

pack = Pack.create([commit, tree, blob]);
log(hex(pack.subarray(pack.length - 20)));
//=> 8eaa2ed0693571e022227e5d5ae5f5d4df1ac88d

log(Pack.valid(pack));
//=> true
var index = PackIndex.create(pack);

log(hex(index.subarray(0, 20)));
//=> 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf



Date.prototype.getTimezoneOffset = oldGetTimezoneOffset;
