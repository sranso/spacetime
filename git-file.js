'use strict';
var GitFile = {};
module.exports = GitFile;
var Sha1 = require('./sha1');
(function () {

var stringToArray = function (string) {
    var array = new Uint8Array(string.length);
    for (var i = 0; i < string.length; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array;
};

GitFile.hashToString = function (hash, offset) {
    var str = [];
    for (var i = 0; i < 20; i++) {
        var hex = '00' + hash[offset + i].toString(16);
        str.push(hex.slice(-2));
    }
    return str.join('');
};


var blobPrefix = stringToArray('blob ');

GitFile.blobFromString = function (string) {
    var lengthString = '' + string.length;
    var blob = new Uint8Array(6 + lengthString.length + string.length);

    var i;
    for (i = 0; i < blobPrefix.length; i++) {
        blob[i] = blobPrefix[i];
    }

    var j = i;
    for (i = 0; i < lengthString.length; i++) {
        blob[j + i] = lengthString.charCodeAt(i);
    }

    j += i + 1;
    for (i = 0; i < string.length; i++) {
        blob[j + i] = string.charCodeAt(i);
    }
    return blob;
};

var emptyBlob = GitFile.emptyBlob = GitFile.blobFromString('');
var emptyBlobHash = GitFile.emptyBlobHash = new Uint8Array(20);

var emptyTree = GitFile.emptyTree = null;
var emptyTreeHash = GitFile.emptyTreeHash = new Uint8Array(20);

var actuallyEmptyTree = stringToArray('tree 0\0');
GitFile._actuallyEmptyTree = actuallyEmptyTree;

var buildEmpty = function () {
    Sha1.hash(emptyBlob, emptyBlobHash, 0);

    var emptyTreeFileInfo = stringToArray('100644 .empty\0');
    var emptyTreeLength = emptyTreeFileInfo.length + 20;
    var emptyTreePrefix = stringToArray('tree ' + emptyTreeLength + '\0');
    GitFile.emptyTree = emptyTree = new Uint8Array(emptyTreePrefix.length + emptyTreeLength);

    var i, j;
    for (i = 0; i < emptyTreePrefix.length; i++) {
        emptyTree[i] = emptyTreePrefix[i];
    }

    j = i;
    for (i = 0; i < emptyTreeFileInfo.length; i++) {
        emptyTree[j + i] = emptyTreeFileInfo[i];
    }

    j += i;
    for (i = 0; i < emptyBlobHash.length; i++) {
        emptyTree[j + i] = emptyBlobHash[i];
    }

    Sha1.hash(emptyTree, emptyTreeHash, 0);
};

var treePrefix = stringToArray('tree ');
var treeMode = stringToArray('40000');
var blobMode = stringToArray('100644');

GitFile.catFile = function (file) {
    var type = String.fromCharCode.apply(null, file.subarray(0, file.indexOf(0x20)));

    if (type === 'blob') {
        return String.fromCharCode.apply(null, file.subarray(file.indexOf(0)));

    } else if (type === 'tree') {
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
    } else {
        throw new Error('Unknown type: ' + type);
    }
};

GitFile.hashEqual = function (hash1, offset1, hash2, offset2) {
    if (hash1 === hash2 && offset1 === offset2) {
        return true;
    }
    var i;
    for (i = 0; i < 20; i++) {
        if (hash1[offset1 + i] !== hash2[offset2 + i]) {
            return false;
        }
    }
    return true;
};

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

GitFile.createSkeleton = function (offsets, props) {
    var file = emptyTree;

    var name;
    for (name in props) {
        file = GitFile.addProperty(file, offsets, name, props[name]);
    }

    return file;
};

GitFile.addProperty = function (oldFile, offsets, insertName, type) {
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
        hash = emptyBlobHash;
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

GitFile.setHash = function (file, offset, hash, hashOffset) {
    var i;
    for (i = 0; i < 20; i++) {
        file[offset + i] = hash[hashOffset + i];
    }
};

buildEmpty();

})();
