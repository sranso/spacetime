'use strict';
global.Commit = {};
(function () {

Commit.clone = function (original) {
    return {
        tree: original.tree,
        parents: original.parents,
        author: original.author,
        committer: original.committer,
        message: original.message,
        file: original.file.slice(),
        hash: null,
        hashOffset: 0,
    };
};

Commit.none = Commit.clone({
    tree: null,
    parents: null,
    author: {
        name: 'Your Name',
        email: 'you@example.com',
        date: new Date(),
    },
    committer: {
        name: 'Your Name',
        email: 'you@example.com',
        date: new Date(),
    },
    message: 'Initial commit\n',
    file: new Uint8Array(0),
    hash: new Uint8Array(0),
    hashOffset: 0,
});

Commit.checkout = function (packIndices, table, hash, hashOffset) {
    var commit = HashTable.get(table, hash, hashOffset);
    if (commit) {
        return commit;
    }

    var packs = packIndices;
    var file = PackIndex.lookupFileMultiple(packs, hash, hashOffset);

    commit = Commit.clone(Commit.none);
    commit.file = file;
    commit.hash = hash;
    commit.hashOffset = hashOffset;
    HashTable.save(table, commit);

    commit.author = CommitFile.parseAuthor(file);
    commit.committer = CommitFile.parseAuthor(file);
    commit.message = CommitFile.parseMessage(file);

    return commit;
};

Commit.checkoutTree = function (commit, packIndices, table) {
    var treeHash = CommitFile.parseTree(commit.file);
    commit.tree = Project.checkout(packIndices, table, treeHash, 0);
};

Commit.checkoutParents = function (commit, packIndices, table) {
    var parentHashes = CommitFile.parseParents(commit.file);
    commit.parents = [];
    var i;

    for (i = 0; i < parentHashes.length; i++) {
        commit.parents[i] = Commit.checkout(packIndices, table, parentHashes[i], 0);
    }
};

})();