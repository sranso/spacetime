'use strict';
global.Tree = {};
(function () {

var emptyTree = Tree.empty = null;
var emptyTreeHash = Tree.emptyHash = new Uint8Array(20);

var actuallyEmptyTree = GitFile.stringToArray('tree 0\0');
Tree._actuallyEmptyTree = actuallyEmptyTree;

var buildEmpty = function () {
    var emptyTreeFileInfo = GitFile.stringToArray('100644 .empty\0');
    var emptyTreeLength = emptyTreeFileInfo.length + 20;
    var emptyTreePrefix = GitFile.stringToArray('tree ' + emptyTreeLength + '\0');
    Tree.empty = emptyTree = new Uint8Array(emptyTreePrefix.length + emptyTreeLength);

    var i, j;
    for (i = 0; i < emptyTreePrefix.length; i++) {
        emptyTree[i] = emptyTreePrefix[i];
    }

    j = i;
    for (i = 0; i < emptyTreeFileInfo.length; i++) {
        emptyTree[j + i] = emptyTreeFileInfo[i];
    }

    j += i;
    for (i = 0; i < Blob.emptyHash.length; i++) {
        emptyTree[j + i] = Blob.emptyHash[i];
    }

    Sha1.hash(emptyTree, emptyTreeHash, 0);
};

var treePrefix = GitFile.stringToArray('tree ');
var treeMode = GitFile.stringToArray('40000');
var blobMode = GitFile.stringToArray('100644');

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
    var type = String.fromCharCode.apply(null, file.subarray(0, file.indexOf(0x20)));

    if (type !== 'tree') {
        throw new Error('Unexpected type: ' + type);
    }

    var pretty = [];
    var j;
    j = file.indexOf(0) + 1;
    while (j < file.length) {
        var modeEnd = file.indexOf(0x20, j + 5);
        var filenameEnd = file.indexOf(0, modeEnd + 2);

        var mode = String.fromCharCode.apply(null, file.subarray(j, modeEnd));
        if (mode === '100644') {
            var subType = 'blob';
        } else if (mode === '40000') {
            mode = '040000';
            var subType = 'tree';
        } else {
            var subType = 'unknown';
        }

        j = modeEnd + 1;
        var filename = String.fromCharCode.apply(null, file.subarray(j, filenameEnd));

        j = filenameEnd + 1;
        var hash = GitFile.hashToString(file, j);
        pretty.push([mode, subType, hash, '  ', filename].join(' '));

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
        hash = Blob.emptyHash;
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

    var j = oldHeaderLength;
    var k;
    var copyEnd;
    var offset = headerLength - oldHeaderLength;
    while (j < oldFile.length) {
        var modeEnd = oldFile.indexOf(0x20, j + 5);
        var filenameEnd = oldFile.indexOf(0, modeEnd + 2);

        var name = String.fromCharCode.apply(null, oldFile.subarray(modeEnd + 1, filenameEnd));

        if (insertName < name) {
            break;
        }

        copyEnd = filenameEnd + 21;
        for (i = j; i < copyEnd; i++) {
            file[offset + i] = oldFile[i];
        }
        offsets[name] = offset + filenameEnd + 1;
        j = filenameEnd + 21;
    }

    k = j + offset;
    for (i = 0; i < mode.length; i++) {
        file[k + i] = mode[i];
    }
    file[k + i] = 0x20;
    k += i + 1;

    for (i = 0; i < insertName.length; i++) {
        file[k + i] = insertName.charCodeAt(i);
    }
    k += i + 1;

    offsets[insertName] = k;
    for (i = 0; i < hash.length; i++) {
        file[k + i] = hash[i];
    }
    k += i;

    offset = k - j;
    while (j < oldFile.length) {
        var modeEnd = oldFile.indexOf(0x20, j + 5);
        var filenameEnd = oldFile.indexOf(0, modeEnd + 2);

        var name = String.fromCharCode.apply(null, oldFile.subarray(modeEnd + 1, filenameEnd));

        copyEnd = filenameEnd + 21;
        for (i = j; i < copyEnd; i++) {
            file[offset + i] = oldFile[i];
        }
        offsets[name] = offset + filenameEnd + 1;
        j = filenameEnd + 21;
    }

    return file;
};

buildEmpty();

})();
