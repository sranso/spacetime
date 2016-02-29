'use strict';
global.Tree = {};
(function () {

Tree.emptyStart = -1;
Tree.emptyEnd = -1;
Tree.emptyHashOffset = -1;

Tree._actuallyEmptyStart = -1;
Tree._actuallyEmptyEnd = -1;
Tree._actuallyEmptyHashOffset = -1;

Tree.initialize = function () {
    $Heap.nextOffset = 64 * Math.ceil($Heap.nextOffset / 64);
    Tree.emptyHashOffset = $Heap.nextOffset;
    Tree._actuallyEmptyHashOffset = $Heap.nextOffset + 20;
    $Heap.nextOffset += 40;

    var emptyTree = Tree.create({'.empty': 'blob'});
    Tree.emptyStart = emptyTree[0];
    Tree.emptyEnd = emptyTree[1];
    var offsets = emptyTree[2];
    var hashOffset = emptyTree.fileStart + offsets['.empty'];
    GitConvert.setHash($, hashOffset, $, Blob.emptyHashOffset);
    Sha1.hash($, Tree.emptyStart, Tree.emptyEnd, $, Tree.emptyHashOffset);

    var actuallyEmptyTree = Tree.create({});
    Tree._actuallyEmptyStart = actuallyEmptyTree[0];
    Tree._actuallyEmptyEnd = actuallyEmptyTree[1];
    Sha1.hash($, Tree._actuallyEmptyStart, Tree._actuallyEmptyEnd, $, Tree._actuallyEmptyHashOffset);
};

Tree.catFile = function (treeStart, treeEnd) {
    var pretty = [];
    var j = $.indexOf(0, treeStart + 6) + 1;
    while (j < treeEnd) {
        var modeEnd = $.indexOf(0x20, j + 5);
        var filenameEnd = $.indexOf(0, modeEnd + 2);

        var mode = String.fromCharCode.apply(null, $.subarray(j, modeEnd));
        if (mode === '100644') {
            var type = 'blob';
        } else if (mode === '40000') {
            mode = '040000';
            var type = 'tree';
        } else {
            var type = 'unknown';
        }

        j = modeEnd + 1;
        var filename = String.fromCharCode.apply(null, $.subarray(j, filenameEnd));

        j = filenameEnd + 1;
        var hash = GitConvert.hashToString($, j);
        pretty.push([mode, type, hash, '  ', filename].join(' '));

        j += 20;
    }

    return pretty.join('\n');
};

var treePrefix = GitConvert.stringToArray('tree ');
var treeMode = GitConvert.stringToArray('40000');
var blobMode = GitConvert.stringToArray('100644');

Tree.create = function (props) {
    var names = Object.keys(props);
    names.sort();

    var length = 0;
    var n;
    for (n = 0; n < names.length; n++) {
        var name = names[n];
        if (props[name] === 'tree') {
            length += treeMode.length;
        } else {
            length += blobMode.length;
        }
        length += 1 + name.length + 1 + 20;
    }

    var lengthString = '' + length;
    var headerLength = treePrefix.length + lengthString.length + 1;
    var treeLength = headerLength + length;
    if ($Heap.nextOffset + treeLength > $Heap.capacity) {
        FileSystem.resizeHeap($FileSystem, treeLength);
    }
    var treeStart = $Heap.nextOffset;
    var treeEnd = treeStart + treeLength;
    $Heap.nextOffset = treeEnd;

    var offsets = {};

    var tree_j = treeStart;
    var i;
    for (i = 0; i < treePrefix.length; i++) {
        $[tree_j + i] = treePrefix[i];
    }

    tree_j += i;
    for (i = 0; i < lengthString.length; i++) {
        $[tree_j + i] = lengthString.charCodeAt(i);
    }
    $[tree_j + i] = 0;

    tree_j += i + 1;
    for (n = 0; n < names.length; n++) {
        var name = names[n];
        if (props[name] === 'tree') {
            var mode = treeMode;
            var hashOffset = Tree.emptyHashOffset;
        } else {
            var mode = blobMode;
            var hashOffset = Blob.emptyHashOffset;
        }

        for (i = 0; i < mode.length; i++) {
            $[tree_j + i] = mode[i];
        }
        $[tree_j + i] = 0x20;

        tree_j += i + 1;
        for (i = 0; i < name.length; i++) {
            $[tree_j + i] = name.charCodeAt(i);
        }
        $[tree_j + i] = 0;

        tree_j += i + 1;
        offsets[name] = tree_j - treeStart;
        for (i = 0; i < 20; i++) {
            $[tree_j + i] = $[hashOffset + i];
        }

        tree_j += 20;
    }

    return [treeStart, treeEnd, offsets];
};

})();
