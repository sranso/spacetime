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

    tempHashOffset = $heap.nextOffset;
    $heap.nextOffset += 20;
    parentHashOffset = $heap.nextOffset;
    $heap.nextOffset += 20;
    mergeParentHashOffset = $heap.nextOffset;
    $heap.nextOffset += 20;
};

var fileRange = new Uint32Array(2);

Commit.setAll = function (original, modifications) {
    var $h = $heap.array;

    var commit = clone(original);
    var prop;
    for (prop in modifications) {
        commit[prop] = modifications[prop];
    }

    CommitFile.create(commit, fileRange);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    Sha1.hash($fileCache.array, fileStart, fileEnd, $h, tempHashOffset);
    var hashOffset = HashTable.findHashOffset($hashTable, $h, tempHashOffset);
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($hashTable, hashOffset, $h, tempHashOffset);
        $objects.table[HashTable.objectIndex(hashOffset)] = commit;
        $hashTable.array[HashTable.typeOffset(hashOffset)] |= HashTable.isObject;
        FileCache.registerCachedFile($fileCache, fileStart, fileEnd, hashOffset);
    } else {
        var typeOffset = HashTable.typeOffset(hashOffset);
        if ($hashTable.array[typeOffset] & HashTable.isObject) {
            return $objects.table[HashTable.objectIndex(hashOffset)];
        }
        $objects.table[HashTable.objectIndex(hashOffset)] = commit;
        $hashTable.array[typeOffset] |= HashTable.isObject;
        FileCache.registerCachedFile($fileCache, fileStart, fileEnd, hashOffset);
    }

    commit.fileStart = fileStart;
    commit.fileEnd = fileEnd;
    commit.hashOffset = hashOffset;

    return commit;
};

var checkoutFile = function ($f, fileStart, fileEnd) {
    var commit = clone(Commit.none);
    CommitFile.parse($f, fileStart, fileEnd, commit);
    commit.fileStart = fileStart;
    commit.fileEnd = fileEnd;
    return commit;
};

Commit.checkout = function ($s, searchHashOffset) {
    return FastCheckout.checkout($s, searchHashOffset, checkoutFile);
};

Commit.checkoutTree = function (commit, packIndices, table) {
    var $h = $heap.array;
    CommitFile.parseTree($fileCache.array, commit.fileStart, commit.fileEnd, $h, tempHashOffset);
    commit.tree = Project.checkout(treeHashOffset);
};

Commit.checkoutParents = function (commit) {
    var $h = $heap.array;
    var numParents = CommitFile.parseParents($fileCache.array, commit.fileStart, commit.fileEnd, $h, parentHashOffset);

    if (numParents >= 1) {
        commit.parent = Commit.checkout($h, parentHashOffset);
    }
    if (numParents >= 2) {
        commit.mergeParent = Commit.checkout($h, mergeParentHashOffset);
    }
};

})();
