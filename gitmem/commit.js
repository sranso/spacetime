'use strict';
global.Commit = {};
(function () {

var clone = function (original) {
    return {
        pointer: -1,

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
var parentPointer = -1;
var mergeParentPointer = -1;
var tempPointer = -1;

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

    tempPointer = $heap.nextOffset;
    $heap.nextOffset += 20;
    parentPointer = $heap.nextOffset;
    $heap.nextOffset += 20;
    mergeParentPointer = $heap.nextOffset;
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

    Sha1.hash($fileCache.array, fileStart, fileEnd, $h, tempPointer);
    var pointer = Table.findPointer($table, $h, tempPointer);
    if (pointer < 0) {
        pointer = ~pointer;
        Table.setHash($table, pointer, $h, tempPointer);
        $table.objects[Table.objectIndex(pointer)] = commit;
        $table.hashes8[Table.typeOffset(pointer)] |= Table.isObject;
        FileCache.registerCachedFile($fileCache, fileStart, fileEnd, pointer);
    } else {
        var typeOffset = Table.typeOffset(pointer);
        if ($table.hashes8[typeOffset] & Table.isObject) {
            return $table.objects[Table.objectIndex(pointer)];
        }
        $table.objects[Table.objectIndex(pointer)] = commit;
        $table.hashes8[typeOffset] |= Table.isObject;
        FileCache.registerCachedFile($fileCache, fileStart, fileEnd, pointer);
    }

    commit.pointer = pointer;

    return commit;
};

var checkoutFile = function ($f, fileStart, fileEnd) {
    var commit = clone(Commit.none);
    CommitFile.parse($f, fileStart, fileEnd, commit);
    commit.fileStart = fileStart;
    commit.fileEnd = fileEnd;
    return commit;
};

Commit.checkout = function ($s, searchPointer) {
    return FastCheckout.checkout($s, searchPointer, checkoutFile);
};

Commit.checkoutTree = function (commit, packIndices, table) {
    var $h = $heap.array;
    CommitFile.parseTree($fileCache.array, commit.fileStart, commit.fileEnd, $h, tempPointer);
    commit.tree = Project.checkout(treePointer);
};

Commit.checkoutParents = function (commit) {
    var $h = $heap.array;
    var data32_offset = (commit.pointer >> 2) + Table.data32_cacheIndex;
    var cacheIndex = $table.data32[data32_offset];
    var doubleIndex = 2 * cacheIndex;
    var fileStart = $fileCache.fileRanges[doubleIndex];
    var fileEnd = $fileCache.fileRanges[doubleIndex + 1];
    var numParents = CommitFile.parseParents($fileCache.array, fileStart, fileEnd, $h, parentPointer);

    if (numParents >= 1) {
        commit.parent = Commit.checkout($h, parentPointer);
    }
    if (numParents >= 2) {
        commit.mergeParent = Commit.checkout($h, mergeParentPointer);
    }
};

})();
