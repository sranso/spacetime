var helper = require('../helper');
var hex = helper.hex;

var blob = Blob.createFromString('foo bar\n');

var deflated = pako.deflate(blob, {level: 1, chunkSize: 4096});
log(hex(deflated));
//=> 78014bcac94f52b06048cbcf57484a2ce20200268c049b
log(deflated.length);
//=> 23

var inflate = new pako.Inflate({chunkSize: 4096});
inflate.push(deflated);
log(helper.pretty(inflate.result));
//=> blob 8\x00foo bar
//=>
log(inflate.strm.next_in);
//=> 23

var pack = new Uint8Array(15);
var j = Pack._packFile(pack, 0, blob);
log(j, pack[0].toString(16));
//=> 17 '38'

log(hex(pack.subarray(0, j)));
//=> 38789c4bcbcf57484a2ce202000d14

pack = Pack.create([blob]);
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

var commit = CommitFile.createFromObject(commitObject);
var commitHash = new Uint8Array(20);
Sha1.hash(commit, commitHash, 0);
log(hex(commitHash));
//=> 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf

pack = Pack.create([commit, tree, blob]);
log(hex(pack));
//=> 5041434b00000002000000039d0b789c9d8c4b0ac2301400f739c5bb80927f1a90e256b79ee025ef05a36d0a35bdbf153d819b8199c5f4951942d4ece5402e456515a7cc141cdb1c28aaa24bb625120ec908dcfa7d59e18a4f861b369ab646707aec7afee0f54bc7bccc2328ebac56267a0307e9a5147b9d6beffcf7405c5aed1527f89ec41b30b73b78a602789c3334303033315148cbcf4f4a2cd22ba92861b856facbe5291bdba9e5ac87bff43ed0f9a879fce722000f8b111338789c4bcbcf57484a2ce202000d1402a48eaa2ed0693571e022227e5d5ae5f5d4df1ac88d






log(Pack.valid(pack));
//=> true

pack[pack.length - 1] = 0;
log(Pack.valid(pack));
//=> false

var file = new Uint8Array(0);
var packOffset = 138;
var ex = Pack.extractFile(pack, packOffset, file, 0);
log(ex);
//=> [ 0, 46 ]

file = new Uint8Array(ex[1]);
ex = Pack.extractFile(pack, packOffset, file, 0);
log(ex);
//=> [ 187, 46 ]
log(helper.pretty(file));
//=> tree 38\x00100644 foobar.txt\x00\xd6u\xfaD\xe5\x06\x06\xca\xa7\x05\xc3\xf4\x8d\xe0,\xf1\x29\xc7\xf9\xa2
