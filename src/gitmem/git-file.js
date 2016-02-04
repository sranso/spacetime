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

var hexCharacters = GitFile.stringToArray('0123456789abcdef');

GitFile.hashToHex = function (hash, hashOffset, hex, hexOffset) {
    var i;
    for (i = 0; i < 40; i += 2) {
        var h = hash[hashOffset + i / 2];
        hex[hexOffset + i] = hexCharacters[h >>> 4];
        hex[hexOffset + i + 1] = hexCharacters[h & 0xf];
    }
};

var hexTable = new Uint8Array([
    -1, -1, -1, -1, -1, -1, -1, -1,  // 00-07
    -1, -1, -1, -1, -1, -1, -1, -1,  // 08-0f
    -1, -1, -1, -1, -1, -1, -1, -1,  // 10-17
    -1, -1, -1, -1, -1, -1, -1, -1,  // 18-1f
    -1, -1, -1, -1, -1, -1, -1, -1,  // 20-27
    -1, -1, -1, -1, -1, -1, -1, -1,  // 28-2f
     0,  1,  2,  3,  4,  5,  6,  7,  // 30-37
     8,  9, -1, -1, -1, -1, -1, -1,  // 38-3f
    -1, 10, 11, 12, 13, 14, 15, -1,  // 40-47
    -1, -1, -1, -1, -1, -1, -1, -1,  // 48-4f
    -1, -1, -1, -1, -1, -1, -1, -1,  // 50-57
    -1, -1, -1, -1, -1, -1, -1, -1,  // 58-5f
    -1, 10, 11, 12, 13, 14, 15, -1,  // 60-67
    -1, -1, -1, -1, -1, -1, -1, -1,  // 68-67
    -1, -1, -1, -1, -1, -1, -1, -1,  // 70-77
    -1, -1, -1, -1, -1, -1, -1, -1,  // 78-7f
    -1, -1, -1, -1, -1, -1, -1, -1,  // 80-87
    -1, -1, -1, -1, -1, -1, -1, -1,  // 88-8f
    -1, -1, -1, -1, -1, -1, -1, -1,  // 90-97
    -1, -1, -1, -1, -1, -1, -1, -1,  // 98-9f
    -1, -1, -1, -1, -1, -1, -1, -1,  // a0-a7
    -1, -1, -1, -1, -1, -1, -1, -1,  // a8-af
    -1, -1, -1, -1, -1, -1, -1, -1,  // b0-b7
    -1, -1, -1, -1, -1, -1, -1, -1,  // b8-bf
    -1, -1, -1, -1, -1, -1, -1, -1,  // c0-c7
    -1, -1, -1, -1, -1, -1, -1, -1,  // c8-cf
    -1, -1, -1, -1, -1, -1, -1, -1,  // d0-d7
    -1, -1, -1, -1, -1, -1, -1, -1,  // d8-df
    -1, -1, -1, -1, -1, -1, -1, -1,  // e0-e7
    -1, -1, -1, -1, -1, -1, -1, -1,  // e8-ef
    -1, -1, -1, -1, -1, -1, -1, -1,  // f0-f7
    -1, -1, -1, -1, -1, -1, -1, -1,  // f8-ff
]);

GitFile.hexToHash = function (hex, hexOffset, hash, hashOffset) {
    var i;
    for (i = 0; i < 40; i += 2) {
        hash[hashOffset + i / 2] = (hexTable[hex[hexOffset + i]] << 4) | hexTable[hex[hexOffset + i + 1]];
    }
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
