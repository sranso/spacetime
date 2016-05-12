'use strict';
global.Convert = {};
(function () {

Convert.stringToArray = function (string) {
    var array = new Uint8Array(string.length);
    var i;
    for (i = 0; i < string.length; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array;
};

Convert.stringToExistingArray = function ($e, existingOffset, string) {
    var i;
    for (i = 0; i < string.length; i++) {
        $e[existingOffset + i] = string.charCodeAt(i);
    }
};

Convert.arrayToExistingArray = function ($e, existingOffset, fromArray) {
    var i;
    for (i = 0; i < fromArray.length; i++) {
        $e[existingOffset + i] = fromArray[i];
    }
};

var hexCharacters = Convert.stringToArray('0123456789abcdef');

Convert.hashToHex = function (hashArray, hashOffset, hexArray, hexOffset) {
    var i;
    for (i = 0; i < 40; i += 2) {
        var h = hashArray[hashOffset + i / 2];
        hexArray[hexOffset + i] = hexCharacters[h >>> 4];
        hexArray[hexOffset + i + 1] = hexCharacters[h & 0xf];
    }
};

var hexTable = new Uint8Array([
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 00-07
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 08-0f
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 10-17
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 18-1f
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 20-27
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 28-2f
     0|0,  1|0,  2|0,  3|0,  4|0,  5|0,  6|0,  7|0,  // 30-37
     8|0,  9|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 38-3f
    -1|0, 10|0, 11|0, 12|0, 13|0, 14|0, 15|0, -1|0,  // 40-47
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 48-4f
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 50-57
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 58-5f
    -1|0, 10|0, 11|0, 12|0, 13|0, 14|0, 15|0, -1|0,  // 60-67
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 68-67
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 70-77
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 78-7f
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 80-87
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 88-8f
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 90-97
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // 98-9f
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // a0-a7
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // a8-af
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // b0-b7
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // b8-bf
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // c0-c7
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // c8-cf
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // d0-d7
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // d8-df
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // e0-e7
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // e8-ef
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // f0-f7
    -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0, -1|0,  // f8-ff
]);

Convert.hexToHash = function (hexArray, hexOffset, hashArray, hashOffset) {
    var i;
    for (i = 0; i < 40; i += 2) {
        hashArray[hashOffset + i / 2] = (
            (hexTable[hexArray[hexOffset + i]] << 4) |
            hexTable[hexArray[hexOffset + i + 1]]
        );
    }
};

Convert.pktLineToLength = function ($p, pktOffset) {
    return (
        (hexTable[$p[pktOffset]] << 12) |
        (hexTable[$p[pktOffset + 1]] << 8) |
        (hexTable[$p[pktOffset + 2]] << 4) |
        hexTable[$p[pktOffset + 3]]
    );
};

})();
