'use strict';
global.HashTable = {};
(function () {

HashTable.create = function (n, heap, random) {
    var hashesSize = 64 * Math.ceil(n / 3);
    var hashesOffset = 64 * Math.ceil(heap.nextOffset / 64);
    heap.nextOffset = hashesOffset + hashesSize;

    var objects = new Array(n);
    var i;
    for (i = 0; i < n; i++) {
        objects[i] = null;
    }

    return {
        hashesOffset: hashesOffset,
        objects: objects,
        n: n,
        load: 0,
        hashBitsToShift: 32 - GitConvert.log2PowerOf2(n),
        a: Random.uint32(random) | 1,
    };
};

HashTable.findHashOffset = function (table, searchHashOffset) {
    var h1 = Math.imul(table.a,
        ($[searchHashOffset] << 24) |
        ($[searchHashOffset + 1] << 16) |
        ($[searchHashOffset + 2] << 8) |
        $[searchHashOffset + 3]
    );
    var h2 = 1 | (
        ($[searchHashOffset] << 24) |
        ($[searchHashOffset + 1] << 16) |
        ($[searchHashOffset + 2] << 8) |
        $[searchHashOffset + 3]
    );
    var i;
    var j;
    var k;

    for (j = 0; j < 1000; j++) {
        var h = (h1 + Math.imul(j, h2)) >>> table.hashBitsToShift;
        var blockOffset = 64 * Math.floor(h / 3) + table.hashesOffset;
        var setByte = $[blockOffset];

        searchBlock:
        for (k = 0; k < 3; k++) {
            var offset = blockOffset + 4 + 20 * k;
            if (setByte & (1 << k)) {
                for (i = 0; i < 20; i++) {
                    if ($[offset + i] !== $[searchHashOffset + i]) {
                        continue searchBlock;
                    }
                }
                return offset;
            } else {
                return ~offset;
            }
        }
    }

    throw new Error('Reached maximum iterations searching for hash');
};

HashTable.objectI = function (table, hashOffset) {
    var offset = hashOffset - table.hashesOffset;
    return 3 * (offset >>> 6) + ((offset >>> 4) & 3);
};

var blockMask = ~63;

HashTable.flagsOffset = function (table, hashOffset) {
    return (hashOffset & blockMask) + ((hashOffset >>> 4) & 3) + 1;
};

HashTable.isObject = 1;
HashTable.isCachedFile = 2;

HashTable.setHash = function (table, hashOffset, setHashOffset) {
    var blockOffset = hashOffset & blockMask;
    var setBit = 1 << ((hashOffset >>> 4) & 3);
    $[blockOffset] |= setBit;

    var i;
    for (i = 0; i < 20; i++) {
        $[hashOffset + i] = $[setHashOffset + i];
    }
    table.load++;
};

HashTable.save = function (table, object) {
    var hashOffset = HashTable.findHashOffset(table, object.hashOffset);
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash(table, hashOffset, object.hashOffset);
        object.hashOffset = hashOffset;

        var flagsOffset = HashTable.flagsOffset(table, hashOffset);
        $[flagsOffset] |= HashTable.isObject;

        var objectI = HashTable.objectI(table, hashOffset);
        table.objects[objectI] = object;
        return object;
    } else {
        var objectI = HashTable.objectI(table, hashOffset);
        return table.objects[objectI];
    }
};

var clamp = function (d, length) {
    if (d.length > length) {
        return d.slice(0, length - 2) + '..';
    } else {
        return d;
    }
};

var ignoreKeys = ['fileStart', 'fileEnd', 'hashOffset'];

var prettyPrintObject = function (object) {
    var data;
    if (object.hasOwnProperty('data')) {
        data = '' + object.data;
    } else {
        var keys = Object.keys(object);
        keys = keys.filter(function (key) {
            return ignoreKeys.indexOf(key) === -1;
        });
        data = keys.map(function (key) {
            var d = '' + object[key];
            return clamp(key, 6) + '=' + clamp(d, 6);
        }).join(' ');
    }
    var hash = GitConvert.hashToString($, object.hashOffset);
    return '#<' + hash.slice(0, 6) + ' ' + clamp(data, 36) + '>';
};

HashTable.prettyPrint = function (table) {
    var pretty = [];
    var i;
    for (i = 0; i < table.objects.length; i++) {
        if (table.objects[i]) {
            pretty.push(i + ': ' + prettyPrintObject(table.objects[i]));
        }
    }

    return pretty.join('\n');
};

})();
