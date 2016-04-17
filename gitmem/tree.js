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
    var $h = $heap.array;

    $heap.nextOffset = 64 * Math.ceil($heap.nextOffset / 64);
    Tree.emptyHashOffset = $heap.nextOffset;
    Tree._actuallyEmptyHashOffset = $heap.nextOffset + 20;
    $heap.nextOffset += 40;

    var offsets = {};
    var treeRange = Tree.create({'.empty': 'blob'}, offsets, []);
    Tree.emptyStart = treeRange[0];
    Tree.emptyEnd = treeRange[1];
    var hashOffset = Tree.emptyStart + offsets['.empty'];
    Tree.setHash($fileCache.array, hashOffset, $h, Blob.emptyHashOffset);
    Sha1.hash($fileCache.array, Tree.emptyStart, Tree.emptyEnd, $h, Tree.emptyHashOffset);
    log(hash($h, Tree.emptyHashOffset));
    //=> 70bfe9793f3fc43d2a2306a58186fe0c88b86999

    treeRange = Tree.create({}, offsets, []);
    Tree._actuallyEmptyStart = treeRange[0];
    Tree._actuallyEmptyEnd = treeRange[1];
    Sha1.hash($fileCache.array, Tree._actuallyEmptyStart, Tree._actuallyEmptyEnd, $h, Tree._actuallyEmptyHashOffset);
    log(hash($h, Tree._actuallyEmptyHashOffset));
    //=> 4b825dc642cb6eb9a060e54bf8d69288fbee4904
};

var treePrefix = Convert.stringToArray('tree ');
var treeMode = Convert.stringToArray('40000');
var blobMode = Convert.stringToArray('100644');

Tree.create = function (props, offsets, treeRange) {
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
    FileCache.malloc($fileCache, treeLength);
    var treeStart = $fileCache.nextArrayOffset;
    var treeEnd = treeStart + treeLength;
    $fileCache.nextArrayOffset = treeEnd;

    var $f = $fileCache.array;

    var tree_j = treeStart;
    var i;
    for (i = 0; i < treePrefix.length; i++) {
        $f[tree_j + i] = treePrefix[i];
    }

    tree_j += i;
    for (i = 0; i < lengthString.length; i++) {
        $f[tree_j + i] = lengthString.charCodeAt(i);
    }
    $f[tree_j + i] = 0;

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
            $f[tree_j + i] = mode[i];
        }
        $f[tree_j + i] = 0x20;

        tree_j += i + 1;
        for (i = 0; i < name.length; i++) {
            $f[tree_j + i] = name.charCodeAt(i);
        }
        $f[tree_j + i] = 0;

        tree_j += i + 1;
        offsets[name] = tree_j - treeStart;
        for (i = 0; i < 20; i++) {
            $f[tree_j + i] = $heap.array[hashOffset + i];
        }

        tree_j += 20;
    }

    treeRange[0] = treeStart;
    treeRange[1] = treeEnd;
    return treeRange;
};

Tree.setHash = function ($t, targetOffset, $s, sourceOffset) {
    var i;
    for (i = 0; i < 20; i++) {
        $t[targetOffset + i] = $s[sourceOffset + i];
    }
};

})();
