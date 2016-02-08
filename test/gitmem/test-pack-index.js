require('../helper');

var blob = Blob.createFromString('FOO bar\n');

var offsets = {};
var tree = Tree.createSkeleton(offsets, {
    foo: 'blob',
});
Sha1.hash(blob, tree, offsets.foo);

var treeHash = new Uint8Array(20);
Sha1.hash(tree, treeHash, 0);
log(hex(treeHash));
//=> 7c0ac9607b0f31f1e3848f17bbdeb34e83f1ed45

var author = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    time: 1454738689000,
    timezoneOffset: 360,
};

var commitObject = {
    tree: {hash: treeHash, hashOffset: 0},
    parents: [],
    committer: author,
    author: author,
    message: 'Foo commit\n',
};

var commit = CommitFile.createFromObject(commitObject);
var commitHash = new Uint8Array(20);
Sha1.hash(commit, commitHash, 0);
log(hex(commitHash));
//=> e13ec39a3681e3a588ed8c4890fb446a8eebba27

pack = Pack.create([commit, tree, blob]);


var index = PackIndex.create(pack);

log(hex(index.hashes.subarray(0, 20)));
//=> 7c0ac9607b0f31f1e3848f17bbdeb34e83f1ed45
log(hex(index.hashes.subarray(40, 60)));
//=> e13ec39a3681e3a588ed8c4890fb446a8eebba27

var f = index.fanout;
log(f[0x00], f[0x7b], f[0x7c], f[0x94], f[0x95], f[0xe0], f[0xe1], f[0xff]);
//=> 0 0 1 1 2 2 3 3

var file = PackIndex.lookupFile(index, index.hashes, 20);
log(pretty(file));
//=> blob 8\x00FOO bar
//=>

var missingHash = index.hashes.slice(20, 40);
missingHash[19] = 0;
file = PackIndex.lookupFile(index, missingHash, 0);
log(file);
//=> null


commitObject.tree = Tree._actuallyEmptyTreeHash;
var secondPack = Pack.create([commit, Tree._actuallyEmptyTree]);
var secondIndex = PackIndex.create(secondPack);

file = PackIndex.requireFileMultiple([secondIndex, index], index.hashes, 0);
log(pretty(file));
//=> tree 31\x00100644 foo\x00\x95X\x89\x8b\xaf\x21I\xc6N\x80\xb4\xbero\x17\x9d\xa42\x1ao

try {
    PackIndex.requireFileMultiple([secondIndex, index], missingHash, 0);
} catch (e) {
    log(e.message);
    //=> File not found for hash: 9558898baf2149c64e80b4be726f179da4321a00
}
