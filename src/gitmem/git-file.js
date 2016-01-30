'use strict';
global.GitFile = {};
(function () {

GitFile.stringToArray = function (string) {
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

GitFile.catFile = function (file) {
    var type = String.fromCharCode.apply(null, file.subarray(0, file.indexOf(0x20, 4)));

    if (type === 'blob') {
        return Blob.catFile(file);
    } else if (type === 'tree') {
        return Tree.catFile(file);
    } else if (type === 'commit') {
        return Commit.catFile(file);
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

GitFile.setHash = function (file, offset, hash, hashOffset) {
    var i;
    for (i = 0; i < 20; i++) {
        file[offset + i] = hash[hashOffset + i];
    }
};

})();
