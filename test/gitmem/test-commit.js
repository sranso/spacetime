var helper = require('../helper');

var oldGetTimezoneOffset = Date.prototype.getTimezoneOffset;
Date.prototype.getTimezoneOffset = function () {
    return 480;
};

var treeHash = new Uint8Array(20);
Sha1.hash(GitFile.stringToArray('foo hash'), treeHash, 0);
var parentHash = new Uint8Array(20);
Sha1.hash(GitFile.stringToArray('parentHash'), parentHash, 0);

var commitObject = {
    tree: treeHash,
    parents: [parentHash],
    committer: {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        date: new Date(2016, 1, 30, 12, 4, 14),
    },
    author: {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        date: new Date(2016, 1, 29, 21, 27, 53),
    },
    message: 'Add foo.txt\n',
};

var commit = Commit.createFromObject(commitObject);

log(helper.prettyArray(commit));
//=> commit 194\x00tree \x93\xafI\xe3\xb9\xd7\xff\x0e\x86\x22\x7f\xc6\x0f\x1f\x8ct\xfc\x7e\x81a
//=> parent \x5c\xf6\x1e\x7f\xd87\x7e\xb4\x2e\xb0\xf5\x81\x23\x2b\xdfV\x99\xe0\xac\xf0
//=> author Jake Sandlund \x3cjake\x40jakesandlund\x2ecom\x3e 1456802873 \x2b0800
//=> committer Jake Sandlund \x3cjake\x40jakesandlund\x2ecom\x3e 1456855454 \x2b0800
//=>
//=> Add foo\x2etxt
//=>


var secondParent = new Uint8Array(20);
Sha1.hash(GitFile.stringToArray('secondParent'), secondParent, 0);
commitObject.parents.push(secondParent);
var mergeCommit = Commit.createFromObject(commitObject);

log(GitFile.catFile(mergeCommit));
//=> tree 93af49e3b9d7ff0e86227fc60f1f8c74fc7e8161
//=> parent 5cf61e7fd8377eb42eb0f581232bdf5699e0acf0
//=> parent 06d3749d842b0a2f56f5368932fd616f89f7cf58
//=> author Jake Sandlund <jake@jakesandlund.com> 1456802873 +0800
//=> committer Jake Sandlund <jake@jakesandlund.com> 1456855454 +0800
//=>
//=> Add foo.txt
//=>

Date.prototype.getTimezoneOffset = oldGetTimezoneOffset;
