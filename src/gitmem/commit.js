'use strict';
global.Commit = {};
(function () {

var clone = function (original) {
    return {
        flags: 0,
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
    var $h = $Heap.array;

    var commit = clone(original);
    var prop;
    for (prop in modifications) {
        commit[prop] = modifications[prop];
    }

    var fileRange = CommitFile.create(commit);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    Sha1.hash($h, fileStart, fileEnd, $h, tempHashOffset);
    var hashOffset = HashTable.findHashOffset($HashTable, $h, tempHashOffset);
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($HashTable, hashOffset, $h, tempHashOffset);
        $Objects.table[HashTable.objectIndex(hashOffset)] = commit;
    } else {
        var objectIndex = HashTable.objectIndex(hashOffset);
        var found = $Objects.table[objectIndex];
        if (found && (found.flags & Objects.isFullObject)) {
            return foundCommit;
        }
        $Objects.table[objectIndex] = commit;
    }

    commit.flags = Objects.isFullObject;
    commit.fileStart = fileStart;
    commit.fileEnd = fileEnd;
    commit.hashOffset = hashOffset;

    return commit;
};

var checkoutFile = function ($f, fileStart, fileEnd) {
    var commit = clone(Commit.none);
    CommitFile.parse($f, fileStart, fileEnd, commit);
    return commit;
};

Commit.checkout = function ($s, searchHashOffset) {
    return FastCheckout.checkout($s, searchHashOffset, checkoutFile);
};

Commit.checkoutTree = function (commit, packIndices, table) {
    var $h = $Heap.array;
    CommitFile.parseTree($h, commit.fileStart, commit.fileEnd, $h, tempHashOffset);
    commit.tree = Project.checkout(treeHashOffset);
};

Commit.checkoutParents = function (commit) {
    var $h = $Heap.array;
    var numParents = CommitFile.parseParents($h, commit.fileStart, commit.fileEnd, $h, parentHashOffset);

    if (numParents >= 1) {
        commit.parent = Commit.checkout($h, parentHashOffset);
    }
    if (numParents >= 2) {
        commit.mergeParent = Commit.checkout($h, mergeParentHashOffset);
    }
};

})();
