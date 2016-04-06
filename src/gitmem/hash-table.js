'use strict';
global.HashTable = {};
(function () {

HashTable.isObject = 1 << 6;
HashTable.isFileCached = 1 << 7;

HashTable.create = function (n, random) {
    var hashBitsToShift = 32;
    var i = n;
    while (i > 1) {
        i >>>= 1;
        hashBitsToShift--;
    }

    return {
        array: new Uint8Array(64 * Math.ceil(n / 3)),
        n: n,
        load: 0,
        hashBitsToShift: hashBitsToShift,
        mask: -1 >>> hashBitsToShift,
        a: Random.uint32(random) | 1,
    };
};

HashTable.findHashOffset = function (hashTable, $s, searchHashOffset) {
    var h1 = Math.imul(hashTable.a,
        ($s[searchHashOffset] << 24) |
        ($s[searchHashOffset + 1] << 16) |
        ($s[searchHashOffset + 2] << 8) |
        $s[searchHashOffset + 3]
    ) >>> hashTable.hashBitsToShift;
    var h = h1;
    var i;
    var j;
    var k;

    for (j = 1; j < 1000; j++) {
        var blockOffset = 64 * Math.floor(h / 3);
        var setHashes = hashTable.array[blockOffset] & 3;

        searchBlock:
        for (k = 0; k < setHashes; k++) {
            var hashOffset = blockOffset + 4 + 20 * k;
            for (i = 0; i < 20; i++) {
                if (hashTable.array[hashOffset + i] !== $s[searchHashOffset + i]) {
                    continue searchBlock;
                }
            }
            return hashOffset;
        }
        if (setHashes < 3) {
            var hashOffset = blockOffset + 4 + 20 * k;
            return ~hashOffset;
        }

        var h2 = (
            ($s[searchHashOffset + 4] << 24) |
            ($s[searchHashOffset + 5] << 16) |
            ($s[searchHashOffset + 6] << 8) |
            $s[searchHashOffset + 7] |
            1
        );
        h = (h1 + Math.imul(j, h2)) & hashTable.mask;
    }

    throw new Error('Reached maximum iterations searching for hash');
};

HashTable.objectIndex = function (hashOffset) {
    return 3 * (hashOffset >>> 6) + ((hashOffset >>> 4) & 3);
};

var blockMask = ~63;

HashTable.typeOffset = function (hashOffset) {
    return (hashOffset & blockMask) + ((hashOffset >>> 4) & 3) + 1;
};

HashTable.setHash = function (hashTable, hashOffset, $s, sourceHashOffset) {
    var blockOffset = hashOffset & blockMask;
    var setByte = hashTable.array[blockOffset];
    var setHashes = (setByte & 3) + 1;
    hashTable.array[blockOffset] = (setByte & ~3) | setHashes;

    var i;
    for (i = 0; i < 20; i++) {
        hashTable.array[hashOffset + i] = $s[sourceHashOffset + i];
    }
    hashTable.load++;
};

})();
