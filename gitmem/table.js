'use strict';
global.HashTable = {};
(function () {

HashTable.data32_packOffset = 0;
HashTable.data32_moldIndex = 4;
HashTable.data8_stringLength = 19;

HashTable.create = function (n, random) {
    var hashBitsToShift = 32;
    var i = n;
    while (i > 1) {
        i >>>= 1;
        hashBitsToShift--;
    }

    var objects = new Array(n);
    var i;
    for (i = 0; i < n; i++) {
        objects[i] = null;
    }

    var capacity = 64 * Math.ceil(n / 3);
    var dataBuffer = new ArrayBuffer(capacity);

    return {
        hashes8: new Uint8Array(capacity),
        data8: new Uint8Array(dataBuffer),
        data32: new Uint32Array(dataBuffer),
        dataInt32: new Int32Array(dataBuffer),
        dataFloat64: new Float64Array(dataBuffer),
        objects: objects,
        n: n,
        load: 0,
        hashBitsToShift: hashBitsToShift,
        mask: -1 >>> hashBitsToShift,
        a: Random.uint32(random) | 1,
    };
};

HashTable.findHashOffset = function (hashTable, $s, searchHashOffset) {
    var h = Math.imul(hashTable.a,
        ($s[searchHashOffset] << 24) |
        ($s[searchHashOffset + 1] << 16) |
        ($s[searchHashOffset + 2] << 8) |
        $s[searchHashOffset + 3]
    ) >>> hashTable.hashBitsToShift;
    var i;
    var j;
    var k;

    for (j = 0; j < 1000; j++) {
        var blockOffset = 64 * Math.floor(h / 3);
        var setHashes = hashTable.hashes8[blockOffset] & 3;

        searchBlock:
        for (k = 0; k < setHashes; k++) {
            var hashOffset = blockOffset + 4 + 20 * k;
            for (i = 0; i < 20; i++) {
                if (hashTable.hashes8[hashOffset + i] !== $s[searchHashOffset + i]) {
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
        h = (h + h2) & hashTable.mask;
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
    var setByte = hashTable.hashes8[blockOffset];
    var setHashes = (setByte & 3) + 1;
    hashTable.hashes8[blockOffset] = (setByte & ~3) | setHashes;

    var i;
    for (i = 0; i < 20; i++) {
        hashTable.hashes8[hashOffset + i] = $s[sourceHashOffset + i];
    }
    hashTable.load++;
};

})();
