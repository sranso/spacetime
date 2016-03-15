'use strict';
global.HashTable = {};
(function () {

HashTable.create = function (n, random) {
    var hashBitsToShift = 32;
    var i = n;
    while (i > 1) {
        i >>>= 1;
        hashBitsToShift--;
    }

    return {
        hashes: new Uint8Array(64 * Math.ceil(n / 3)),
        n: n,
        load: 0,
        hashBitsToShift: hashBitsToShift,
        mask: -1 >>> hashBitsToShift,
        a: Random.uint32(random) | 1,
    };
};

HashTable.findHashOffset = function (table, $, searchHashOffset) {
    var hashes = table.hashes;
    var h1 = Math.imul(table.a,
        ($[searchHashOffset] << 24) |
        ($[searchHashOffset + 1] << 16) |
        ($[searchHashOffset + 2] << 8) |
        $[searchHashOffset + 3]
    ) >>> table.hashBitsToShift;
    var h = h1;
    var i;
    var j;
    var k;

    for (j = 1; j < 1000; j++) {
        var blockOffset = 64 * Math.floor(h / 3);
        var setByte = hashes[blockOffset];

        searchBlock:
        for (k = 0; k < 3; k++) {
            var hashOffset = blockOffset + 4 + 20 * k;
            if (setByte & (1 << k)) {
                for (i = 0; i < 20; i++) {
                    if (hashes[hashOffset + i] !== $[searchHashOffset + i]) {
                        continue searchBlock;
                    }
                }
                return hashOffset;
            } else {
                return ~hashOffset;
            }
        }

        var h2 = (
            ($[searchHashOffset + 4] << 24) |
            ($[searchHashOffset + 5] << 16) |
            ($[searchHashOffset + 6] << 8) |
            $[searchHashOffset + 7] |
            1
        );
        h = (h1 + Math.imul(j, h2)) & table.mask;
    }

    throw new Error('Reached maximum iterations searching for hash');
};

HashTable.objectIndex = function (hashOffset) {
    return 3 * (hashOffset >>> 6) + ((hashOffset >>> 4) & 3);
};

var blockMask = ~63;

HashTable.setHash = function (table, hashOffset, $, sourceHashOffset) {
    var blockOffset = hashOffset & blockMask;
    var setBit = 1 << ((hashOffset >>> 4) & 3);
    table.hashes[blockOffset] |= setBit;

    var i;
    for (i = 0; i < 20; i++) {
        table.hashes[hashOffset + i] = $[sourceHashOffset + i];
    }
    table.load++;
};

})();
