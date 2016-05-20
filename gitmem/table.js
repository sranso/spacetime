'use strict';
global.Table = {};
(function () {

Table.data32_packOffset = 0;
Table.data32_moldIndex = 4;
Table.data8_stringLength = 19;

Table.create = function (n, random) {
    var hashBitsToShift = 32;
    var i = n;
    while (i > 1) {
        i >>>= 1;
        hashBitsToShift--;
    }

    var capacity = 64 * Math.ceil(n / 3);
    var dataBuffer = new ArrayBuffer(capacity);

    return {
        hashes8: new Uint8Array(capacity),
        data8: new Uint8Array(dataBuffer),
        data32: new Uint32Array(dataBuffer),
        dataInt32: new Int32Array(dataBuffer),
        dataFloat64: new Float64Array(dataBuffer),
        dataLongStrings: [],
        n: n,
        load: 0,
        hashBitsToShift: hashBitsToShift,
        mask: -1 >>> hashBitsToShift,
        a: Random.uint32(random) | 1,
    };
};

Table.findPointer = function (table, $s, searchPointer) {
    var h = Math.imul(table.a,
        ($s[searchPointer] << 24) |
        ($s[searchPointer + 1] << 16) |
        ($s[searchPointer + 2] << 8) |
        $s[searchPointer + 3]
    ) >>> table.hashBitsToShift;
    var i;
    var j;
    var k;

    for (j = 0; j < 1000; j++) {
        var blockOffset = 64 * Math.floor(h / 3);
        var setHashes = table.hashes8[blockOffset] & 3;

        searchBlock:
        for (k = 0; k < setHashes; k++) {
            var pointer = blockOffset + 4 + 20 * k;
            for (i = 0; i < 20; i++) {
                if (table.hashes8[pointer + i] !== $s[searchPointer + i]) {
                    continue searchBlock;
                }
            }
            return pointer;
        }
        if (setHashes < 3) {
            var pointer = blockOffset + 4 + 20 * k;
            return ~pointer;
        }

        var h2 = (
            ($s[searchPointer + 4] << 24) |
            ($s[searchPointer + 5] << 16) |
            ($s[searchPointer + 6] << 8) |
            $s[searchPointer + 7] |
            1
        );
        h = (h + h2) & table.mask;
    }

    throw new Error('Reached maximum iterations searching for hash');
};

var blockMask = ~63;

Table.typeOffset = function (pointer) {
    return (pointer & blockMask) + ((pointer >>> 4) & 3) + 1;
};

Table.setHash = function (table, pointer, $s, sourcePointer) {
    var blockOffset = pointer & blockMask;
    var setByte = table.hashes8[blockOffset];
    var setHashes = (setByte & 3) + 1;
    table.hashes8[blockOffset] = (setByte & ~3) | setHashes;

    var i;
    for (i = 0; i < 20; i++) {
        table.hashes8[pointer + i] = $s[sourcePointer + i];
    }
    table.load++;
};

})();
