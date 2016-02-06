var helper = require('../helper');
var hex = helper.hex;

var blob = Blob.fromString('FOO bar\n');

var offsets = {};
var tree = Tree.createSkeleton(offsets, {
    foo: 'blob',
});
Sha1.hash(blob, tree, offsets.foo);

var treeHash = new Uint8Array(20);
Sha1.hash(tree, treeHash, 0);
log(hex(treeHash));
//=> 7c0ac9607b0f31f1e3848f17bbdeb34e83f1ed45

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
    message: 'Foo commit\n',
};

var commit = Commit.createFromObject(commitObject);
var commitHash = new Uint8Array(20);
Sha1.hash(commit, commitHash, 0);
log(hex(commitHash));
//=> db2742030e36174ce5aa569ef2e97840c4cd47f5

pack = Pack.create([commit, tree, blob]);
var index = PackIndex.create(pack);

log(hex(index.hashes.subarray(0, 20)));
//=> 7c0ac9607b0f31f1e3848f17bbdeb34e83f1ed45
log(hex(index.hashes.subarray(40, 60)));
//=> db2742030e36174ce5aa569ef2e97840c4cd47f5

var f = index.fanout;
log(f[0x00], f[0x7b], f[0x7c], f[0x94], f[0x95], f[0xda], f[0xdb], f[0xff]);
//=> 0 0 1 1 2 2 3 3

var file = PackIndex.lookupFile(index, index.hashes, 20);
log(helper.pretty(file));
//=> blob 8\x00FOO bar
//=>

var missingHash = index.hashes.slice(20, 40);
missingHash[19] = 0;
file = PackIndex.lookupFile(index, missingHash, 0);
log(file);
//=> null



Date.prototype.getTimezoneOffset = oldGetTimezoneOffset;
