var helper = require('../helper');
var hex = helper.hex;

// Recreate a real commit.

var oldGetTimezoneOffset = Date.prototype.getTimezoneOffset;
Date.prototype.getTimezoneOffset = function () {
    return 360;
};

var blob = Blob.fromString('foo\n');
var offsets = {};
var tree = Tree.createSkeleton(offsets, {
    foo: 'blob',
});
Sha1.hash(blob, tree, offsets.foo);

var treeHash = new Uint8Array(20);
Sha1.hash(tree, treeHash, 0);

var parentHash = new Uint8Array([0x4e,0x72,0x11,0x0c,0xbb,0x91,0xdd,0x87,0xf7,0xb7,0xee,0xa2,0x2f,0x5f,0x0b,0xcb,0x23,0x3e,0x95,0xbf]);

var commitObject = {
    tree: treeHash,
    parents: [parentHash],
    committer: {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        date: new Date(1454274859000),
    },
    author: {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        date: new Date(1454274859000),
    },
    message: 'Foo commit\n',
};

var commit = Commit.createFromObject(commitObject);

log(helper.pretty(commit));
//=> commit 233\x00tree 205f6b799e7d5c2524468ca006a0131aa57ecce7
//=> parent 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
//=> author Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=>
//=> Foo commit
//=>

var commitHash = new Uint8Array(20);
Sha1.hash(commit, commitHash, 0);
log(hex(commitHash));
//=> dbcb62b19db062d928144514502df45e86d91eac

var secondParent = new Uint8Array(20);
Sha1.hash(GitFile.stringToArray('secondParent'), secondParent, 0);
commitObject.parents.push(secondParent);
var mergeCommit = Commit.createFromObject(commitObject);

log(GitFile.catFile(mergeCommit));
//=> tree 205f6b799e7d5c2524468ca006a0131aa57ecce7
//=> parent 4e72110cbb91dd87f7b7eea22f5f0bcb233e95bf
//=> parent 06d3749d842b0a2f56f5368932fd616f89f7cf58
//=> author Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=> committer Jake Sandlund <jake@jakesandlund.com> 1454274859 -0600
//=>
//=> Foo commit
//=>

Date.prototype.getTimezoneOffset = oldGetTimezoneOffset;
