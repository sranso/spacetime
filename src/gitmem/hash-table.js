'use strict';
global.HashTable = {};
(function () {

HashTable.create = function (random) {
    var table = {
        hashBitsToShift: 32,
        objects: [[]],
        load: 0,
        a: Random.uint32(random) | 1,
    };

    while (table.objects.length < 4) {
        resizeObjects(table);
    }

    return table;
};

var resizeObjects = function (table) {
    table.hashBitsToShift -= 1;
    var newHashTable = new Array(table.objects.length * 2);

    var i, j;
    for (i = 0; i < newHashTable.length; i += 2) {
        newHashTable[i] = [];
        newHashTable[i + 1] = [];
        var oldList = table.objects[i >> 1];
        for (j = 0; j < oldList.length; j++) {
            var object = oldList[j];
            var hash = object.hash;
            var offset = object.hashOffset;
            var h = Math.imul(table.a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);

            newHashTable[h >>> table.hashBitsToShift].push(object);
        }
    }
    table.objects = newHashTable;
};

HashTable.save = function (table, object) {
    var hash = object.hash;
    var offset = object.hashOffset;
    var h = Math.imul(table.a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);
    var list = table.objects[h >>> table.hashBitsToShift];

    var i;
    for (i = 0; i < list.length; i++) {
        if (GitConvert.hashEqual(hash, offset, list[i].hash, list[i].hashOffset)) {
            return list[i];
        }
    }

    table.load++;
    list.push(object);
    if (table.load > 0.75 * table.objects.length) {
        resizeObjects(table);
    }

    return object;
};

HashTable.get = function (table, hash, offset) {
    var h = Math.imul(table.a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);
    var list = table.objects[h >>> table.hashBitsToShift];

    var i;
    for (i = 0; i < list.length; i++) {
        if (GitConvert.hashEqual(hash, offset, list[i].hash, list[i].hashOffset)) {
            return list[i];
        }
    }
    return null;
};

var clamp = function (d, length) {
    if (d.length > length) {
        return d.slice(0, length - 2) + '..';
    } else {
        return d;
    }
};

var ignoreKeys = ['file', 'hash', 'hashOffset'];

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
    var hash = GitConvert.hashToString(object.hash, object.hashOffset);
    return '#<' + hash.slice(0, 6) + ' ' + clamp(data, 36) + '>';
};

HashTable.prettyPrint = function (table) {
    var pretty = [];
    var i, j;
    for (i = 0; i < table.objects.length; i++) {
        var list = table.objects[i];
        if (list.length) {
            var entries = [];
            for (j = 0; j < list.length; j++) {
                entries.push(prettyPrintObject(list[j]));
            }
            pretty.push(i + ': ' + entries.join(', '));
        }
    }

    return pretty.join('\n');
};

})();
