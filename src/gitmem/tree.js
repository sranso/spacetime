'use strict';
global.Tree = {};
(function () {

var emptyTree = Tree.emptyTree = null;
var emptyTreeHash = Tree.emptyTreeHash = new Uint8Array(20);

var actuallyEmptyTree = GitConvert.stringToArray('tree 0\0');
Tree._actuallyEmptyTree = actuallyEmptyTree;
Tree._actuallyEmptyTreeHash = new Uint8Array(20);

var buildEmpty = function () {
    var emptyTreeFileInfo = GitConvert.stringToArray('100644 .empty\0');
    var emptyTreeLength = emptyTreeFileInfo.length + 20;
    var emptyTreePrefix = GitConvert.stringToArray('tree ' + emptyTreeLength + '\0');
    Tree.emptyTree = emptyTree = new Uint8Array(emptyTreePrefix.length + emptyTreeLength);

    var i, j;
    for (i = 0; i < emptyTreePrefix.length; i++) {
        emptyTree[i] = emptyTreePrefix[i];
    }

    j = i;
    for (i = 0; i < emptyTreeFileInfo.length; i++) {
        emptyTree[j + i] = emptyTreeFileInfo[i];
    }

    j += i;
    for (i = 0; i < Blob.emptyBlobHash.length; i++) {
        emptyTree[j + i] = Blob.emptyBlobHash[i];
    }

    Sha1.hash(emptyTree, emptyTreeHash, 0);
    Sha1.hash(Tree._actuallyEmptyTree, Tree._actuallyEmptyTreeHash, 0);
};

var treePrefix = GitConvert.stringToArray('tree ');
var treeMode = GitConvert.stringToArray('40000');
var blobMode = GitConvert.stringToArray('100644');

var arrayEqual = function (array1, array2) {
    if (array1.length !== array2.length) {
        return false;
    }
    var i;
    for (i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }
    return true;
};

Tree.catFile = function (file) {
    var pretty = [];
    var j = file.indexOf(0, 6) + 1;
    while (j < file.length) {
        var modeEnd = file.indexOf(0x20, j + 5);
        var filenameEnd = file.indexOf(0, modeEnd + 2);

        var mode = String.fromCharCode.apply(null, file.subarray(j, modeEnd));
        if (mode === '100644') {
            var type = 'blob';
        } else if (mode === '40000') {
            mode = '040000';
            var type = 'tree';
        } else {
            var type = 'unknown';
        }

        j = modeEnd + 1;
        var filename = String.fromCharCode.apply(null, file.subarray(j, filenameEnd));

        j = filenameEnd + 1;
        var hash = GitConvert.hashToString(file, j);
        pretty.push([mode, type, hash, '  ', filename].join(' '));

        j += 20;
    }
    return pretty.join('\n');
};

Tree.createSkeleton = function (offsets, props) {
    var file = emptyTree;

    var name;
    for (name in props) {
        file = Tree.addProperty(file, offsets, name, props[name]);
    }

    return file;
};

Tree.addProperty = function (oldFile, offsets, insertName, type) {
    if (oldFile === emptyTree || arrayEqual(oldFile, emptyTree)) {
        oldFile = actuallyEmptyTree;
    }

    var oldHeaderLength = oldFile.indexOf(0, 6) + 1;
    var oldLength = oldFile.length - oldHeaderLength;

    var mode, hash;
    if (type === 'tree') {
        mode = treeMode;
        hash = emptyTreeHash;
    } else {
        mode = blobMode;
        hash = Blob.emptyBlobHash;
    }
    var length = oldLength + mode.length + 1 + insertName.length + 1 + 20;
    var lengthString = '' + length;
    var headerLength = treePrefix.length + lengthString.length + 1;

    var file = new Uint8Array(headerLength + length);

    var i, j;
    for (i = 0; i < treePrefix.length; i++) {
        file[i] = treePrefix[i];
    }

    j = i;
    for (i = 0; i < lengthString.length; i++) {
        file[j + i] = lengthString.charCodeAt(i);
    }
    file[j + i] = 0;

    var k = oldHeaderLength;
    var copyEnd;
    var offset = headerLength - oldHeaderLength;
    while (k < oldFile.length) {
        var modeEnd = oldFile.indexOf(0x20, k + 5);
        var filenameEnd = oldFile.indexOf(0, modeEnd + 2);
        var hashStart = filenameEnd + 1;

        var name = String.fromCharCode.apply(null, oldFile.subarray(modeEnd + 1, filenameEnd));

        if (insertName < name) {
            break;
        }

        copyEnd = hashStart + 20;
        for (i = k; i < copyEnd; i++) {
            file[offset + i] = oldFile[i];
        }
        offsets[name] = offset + hashStart;
        k = hashStart + 20;
    }

    j = k + offset;
    for (i = 0; i < mode.length; i++) {
        file[j + i] = mode[i];
    }
    file[j + i] = 0x20;

    j += i + 1;
    for (i = 0; i < insertName.length; i++) {
        file[j + i] = insertName.charCodeAt(i);
    }
    file[j + i] = 0;

    j += i + 1;
    offsets[insertName] = j;
    for (i = 0; i < hash.length; i++) {
        file[j + i] = hash[i];
    }

    j += i;
    offset = j - k;
    while (k < oldFile.length) {
        var modeEnd = oldFile.indexOf(0x20, k + 5);
        var filenameEnd = oldFile.indexOf(0, modeEnd + 2);

        var name = String.fromCharCode.apply(null, oldFile.subarray(modeEnd + 1, filenameEnd));

        copyEnd = filenameEnd + 21;
        for (i = k; i < copyEnd; i++) {
            file[offset + i] = oldFile[i];
        }
        offsets[name] = offset + filenameEnd + 1;
        k = filenameEnd + 21;
    }

    return file;
};

buildEmpty();

})();
