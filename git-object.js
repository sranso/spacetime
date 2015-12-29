'use strict';
var GitObject = {};
module.exports = GitObject;
var Sha1 = require('./sha1');
(function () {

var stringToArray = function (string) {
    var array = new Uint8Array(string.length);
    for (var i = 0; i < string.length; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array;
};

var arrayToString = function (array) {
    return String.fromCharCode.apply(null, array);
};

GitObject.hexArrayToString = function (array) {
    var str = [];
    for (var i = 0; i < array.length; i++) {
        var hex = '00' + array[i].toString(16);
        str.push(hex.slice(-2));
    }
    return str.join('');
};


var blobPrefix = stringToArray('blob ');

GitObject.blobFromString = function (string) {
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

var emptyBlob = GitObject.emptyBlob = GitObject.blobFromString('');
var emptyBlobHash = GitObject.emptyBlobHash = new Uint8Array(20);

var emptyTree = null;
var emptyTreeHash = new Uint8Array(20);
GitObject.emptyTree = null;

var actuallyEmptyTree = stringToArray('tree 0\0');
GitObject._actuallyEmptyTree = actuallyEmptyTree;

var buildEmpty = function () {
    Sha1.hash(emptyBlob, emptyBlobHash, 0);

    var emptyTreeFileInfo = stringToArray('100644 .empty\0');
    var emptyTreeLength = emptyTreeFileInfo.length + 20;
    var emptyTreePrefix = stringToArray('tree ' + emptyTreeLength + '\0');
    emptyTree = new Uint8Array(emptyTreePrefix.length + emptyTreeLength);

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

    GitObject.emptyTree = GitObject.createSkeleton({});
};

var treePrefix = stringToArray('tree ');
var treeMode = stringToArray('40000');
var blobMode = stringToArray('100644');

GitObject.catFile = function (file) {
    var type = arrayToString(file.slice(0, file.indexOf(0x20)));

    if (type === 'blob') {
        return arrayToString(file.slice(file.indexOf(0)));

    } else if (type === 'tree') {
        var pretty = [];
        var j;
        j = file.indexOf(0) + 1;
        while (j < file.length) {
            var modeEnd = file.indexOf(0x20, j + 5);
            var filenameEnd = file.indexOf(0, modeEnd + 2);

            var mode = arrayToString(file.slice(j, modeEnd));
            if (mode === '100644') {
                var subType = 'blob';
            } else if (mode === '40000') {
                mode = '040000';
                var subType = 'tree';
            } else {
                var subType = 'unknown';
            }

            j = modeEnd + 1;
            var filename = arrayToString(file.slice(j, filenameEnd));

            j = filenameEnd + 1;
            var hash = GitObject.hexArrayToString(file.slice(j, j + 20));
            pretty.push([mode, subType, hash, '  ', filename].join(' '));

            j += 20;
        }
        return pretty.join('\n');
    } else {
        throw new Error('Unknown type: ' + type);
    }
};

GitObject.hashEqual = function (hash1, index1, hash2, index2) {
    var i;
    for (i = 0; i < 20; i++) {
        if (hash1[index1 + i] !== hash2[index2 + i]) {
            return false;
        }
    }
    return true;
};

GitObject.createSkeleton = function (props) {
    var object = {
        file: emptyTree,
        hash: emptyTreeHash,
    };

    var name;
    for (name in props) {
        GitObject.addProperty(object, name, props[name]);
    }

    return object;
};

GitObject.addProperty = function (object, name, type) {
    if (object.hash === emptyTreeHash) {
        var oldFile = actuallyEmptyTree;
    } else {
        var oldFile = object.file;
    }
    object.hash = null;

    var oldHeaderLength = oldFile.indexOf(0, 6) + 1;
    var oldLength = oldFile.length - oldHeaderLength;

    var nameArray = stringToArray(name);

    var mode, hash;
    if (type === 'tree') {
        mode = treeMode;
        hash = emptyTreeHash;
    } else {
        mode = blobMode;
        hash = emptyBlobHash;
    }
    var length = oldLength + mode.length + 1 + name.length + 1 + 20;
    var lengthString = '' + length;
    var headerLength = treePrefix.length + lengthString.length + 1;

    var file = object.file = new Uint8Array(headerLength + length);

    var i, j;
    for (i = 0; i < treePrefix.length; i++) {
        file[i] = treePrefix[i];
    }

    j = i;
    for (i = 0; i < lengthString.length; i++) {
        file[j + i] = lengthString.charCodeAt(i);
    }

    j = oldHeaderLength;
    while (j < oldFile.length) {
        var modeEnd = oldFile.indexOf(0x20, j + 5);
        var filenameEnd = oldFile.indexOf(0, modeEnd + 2);

        var nameStart = modeEnd + 1;
        var nameLength = filenameEnd - nameStart;
        if (nameLength < nameArray.length) {
            var minNameLength = nameLength;
        } else {
            var minNameLength = nameArray.length;
        }

        var diff;
        for (i = 0; i < minNameLength; i++) {
            diff = nameArray[i] - oldFile[nameStart + i];
            if (diff !== 0) {
                break;
            }
        }
        if (i === minNameLength) {
            diff = nameArray.length - nameLength;
        }

        if (diff < 0) {
            break;
        }
        j = filenameEnd + 21;
    }

    var copyEnd = j - oldHeaderLength;
    var k = headerLength;
    for (i = 0; i < copyEnd; i++) {
        file[k + i] = oldFile[oldHeaderLength + i];
    }
    k += i;

    for (i = 0; i < mode.length; i++) {
        file[k + i] = mode[i];
    }
    file[k + i] = 0x20;
    k += i + 1;

    for (i = 0; i < nameArray.length; i++) {
        file[k + i] = nameArray[i];
    }
    file[k + i] = 0;
    k += i + 1;

    for (i = 0; i < hash.length; i++) {
        file[k + i] = hash[i];
    }
    k += i;

    copyEnd = oldFile.length - j;
    for (i = 0; i < copyEnd; i++) {
        file[k + i] = oldFile[j + i];
    }
};

buildEmpty();

})();
