'use strict';
global.CommitObject = {};
(function () {

CommitObject.clone = function (original) {
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

CommitObject.none = CommitObject.clone({
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

CommitObject.checkout = function (packIndices, store, hash, hashOffset) {
    var commit = Store.get(store, hash, hashOffset);
    if (commit) {
        return commit;
    }

    var packs = packIndices;
    var file = PackIndex.lookupFileMultiple(packs, hash, hashOffset);

    commit = CommitObject.clone(CommitObject.none);

    commit.author = CommitFile.parseAuthor(file);
    commit.committer = CommitFile.parseAuthor(file);
    commit.message = CommitFile.parseMessage(file);
    commit.file = file;
    commit.hash = hash;
    commit.hashOffset = hashOffset;

    return Store.save(store, commit);
};

CommitObject.checkoutTree = function (commit, packIndices, store) {
    var treeHash = CommitFile.parseTree(commit.file);
    commit.tree = Project.checkout(packIndices, store, treeHash, 0);
};

CommitObject.checkoutParents = function (commit, packIndices, store) {
    var parentHashes = CommitFile.parseParents(commit.file);
    commit.parents = [];
    var i;

    for (i = 0; i < parentHashes.length; i++) {
        commit.parents[i] = CommitObject.checkout(packIndices, store, parentHashes[i], 0);
    }
};

})();
