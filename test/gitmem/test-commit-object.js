require('../helper');

var fooBlob = Value.blobFromString('foo');

var offsets = {};
var tree = Tree.createSkeleton(offsets, {
    foo: 'blob',
});

Sha1.hash(fooBlob, tree, offsets.foo);

var treeHash = new Uint8Array(20);
Sha1.hash(tree, treeHash, 0);
log(hex(treeHash));
//=> 83eb8cbb4c40875b937d27dd3224c1ceb36e449a

var commit = CommitObject.clone(CommitObject.none);
commit.author = commit.committer = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    time: 1454907687000,
    timezoneOffset: 360,
};
commit.tree = {hash: treeHash, hashOffset: 0};
commit.parents = [];
commit.message = 'Initial commit\n';

commit.file = CommitFile.createFromObject(commit);
commit.hash = new Uint8Array(20);
Sha1.hash(commit.file, commit.hash, 0);
log(hex(commit.hash));
//=> b9b5c2bc0c5b434d250c282ca4178429354ddea5

var secondCommit = CommitObject.clone(commit);
secondCommit.author = {
    name: 'snakes',
    email: commit.author.email,
    time: 1454907943000,
    timezoneOffset: commit.author.timezoneOffset,
};
secondCommit.parents = [commit];

secondCommit.file = CommitFile.createFromObject(secondCommit);
secondCommit.hash = new Uint8Array(20);
Sha1.hash(secondCommit.file, secondCommit.hash, 0);
log(hex(secondCommit.hash));
//=> 0840832364159f7fac3419a336375ce0e54b1ec2

var pack = Pack.create([secondCommit.file, commit.file, tree, fooBlob]);
var index = PackIndex.create(pack);
var store = Store.create();

var gotSecondCommit = CommitObject.checkout([index], store, secondCommit.hash, 0);
log(hex(gotSecondCommit.hash));
//=> 0840832364159f7fac3419a336375ce0e54b1ec2
log(gotSecondCommit.author.name, gotSecondCommit.committer.email);
//=> snakes jake@jakesandlund.com

CommitObject.checkoutParents(gotSecondCommit, [index], store);
var gotCommit = gotSecondCommit.parents[0];
log(hex(gotCommit.hash));
//=> b9b5c2bc0c5b434d250c282ca4178429354ddea5
log(gotCommit.author.name, gotCommit.committer.time);
//=> Jake Sandlund 1454907687000

log(gotCommit.parents);
//=> null
CommitObject.checkoutParents(gotCommit, [index], store);
log(gotCommit.parents);
//=> []
