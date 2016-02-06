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
log(hex(pack.subarray(pack.length - 20)));
//=> 19275a76895c14d26fefbeb91cb9787c2d23011d

log(Pack.valid(pack));
//=> true
var index = PackIndex.create(pack);

log(hex(index.subarray(0, 20)));
//=> 7c0ac9607b0f31f1e3848f17bbdeb34e83f1ed45
log(hex(index.subarray(20, 40)));
//=> 9558898baf2149c64e80b4be726f179da4321a6f
log(hex(index.subarray(40, 60)));
//=> db2742030e36174ce5aa569ef2e97840c4cd47f5



Date.prototype.getTimezoneOffset = oldGetTimezoneOffset;
