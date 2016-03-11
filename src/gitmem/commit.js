'use strict';
global.Commit = {};
(function () {

var clone = function (original) {
    return {
        fileStart: -1,
        fileEnd: -1,
        hashOffset: -1,

        tree: original.tree,
        parent: original.parent,
        mergeParent: original.mergeParent,

        authorName: original.authorName,
        authorEmail: original.authorEmail,
        authorTime: original.authorTime,
        authorTimezoneOffset: original.authorTimezoneOffset,

        committerName: original.committerName,
        committerEmail: original.committerEmail,
        committerTime: original.committerTime,
        committerTimezoneOffset: original.committerTimezoneOffset,

        message: original.message,
    };
};

Commit.none = null;
var parentHashOffset = -1;
var mergeParentHashOffset = -1;
var tempHashOffset = -1;

Commit.initialize = function () {
    Commit.none = clone({
        tree: null,
        parent: null,
        mergeParent: null,

        authorName: 'Your Name',
        authorEmail: 'you@example.com',
        authorTime: Date.now(),
        authorTimezoneOffset: (new Date()).getTimezoneOffset(),

        committerName: 'Your Name',
        committerEmail: 'you@example.com',
        committerTime: Date.now(),
        committerTimezoneOffset: (new Date()).getTimezoneOffset(),

        message: 'Initial commit\n',
    });

    tempHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
    parentHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
    mergeParentHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
};

Commit.setAll = function (original, modifications) {
    var commit = clone(original);
    var prop;
    for (prop in modifications) {
        commit[prop] = modifications[prop];
    }

    var fileRange = CommitFile.create(commit);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    Sha1.hash($, fileStart, fileEnd, $, tempHashOffset);
    var hashOffset = HashTable.findHashOffset($HashTable, tempHashOffset);
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($HashTable, hashOffset, tempHashOffset);
    }
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
    if ($[flagsOffset] & HashTable.isObject) {
        return $HashTable.objects[objectIndex];
    }

    commit.fileStart = fileStart;
    commit.fileEnd = fileEnd;
    commit.hashOffset = hashOffset;

    $[flagsOffset] |= HashTable.isObject;
    $[flagsOffset] &= ~HashTable.isCachedFile;
    $HashTable.objects[objectIndex] = commit;

    return commit;
};

var checkoutFile = function (fileStart, fileEnd) {
    var commit = clone(Commit.none);
    CommitFile.parse(fileStart, fileEnd, commit);
    return commit;
};

Commit.checkout = function (searchHashOffset) {
    return FastCheckout.checkout(searchHashOffset, checkoutFile);
};

Commit.checkoutTree = function (commit, packIndices, table) {
    CommitFile.parseTree(commit.fileStart, commit.fileEnd, tempHashOffset);
    commit.tree = Project.checkout(treeHashOffset);
};

Commit.checkoutParents = function (commit) {
    var numParents = CommitFile.parseParents(commit.fileStart, commit.fileEnd, parentHashOffset);

    if (numParents >= 1) {
        commit.parent = Commit.checkout(parentHashOffset);
    }
    if (numParents >= 2) {
        commit.mergeParent = Commit.checkout(mergeParentHashOffset);
    }
};

})();
