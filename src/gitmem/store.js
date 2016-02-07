'use strict';
global.Store = {};
(function () {

Store.create = function () {
    var store = {
        hashBitsToShift: 32,
        objects: [[]],
        load: 0,
        a: Random.rand() | 1,
    };

    while (store.objects.length < 4) {
        resizeObjects(store);
    }

    return store;
};

var resizeObjects = function (store) {
    store.hashBitsToShift -= 1;
    var newStore = new Array(store.objects.length * 2);

    var i, j;
    for (i = 0; i < newStore.length; i += 2) {
        newStore[i] = [];
        newStore[i + 1] = [];
        var oldList = store.objects[i >> 1];
        for (j = 0; j < oldList.length; j++) {
            var object = oldList[j];
            var hash = object.hash;
            var offset = object.hashOffset;
            var h = Math.imul(store.a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);

            newStore[h >>> store.hashBitsToShift].push(object);
        }
    }
    store.objects = newStore;
};

Store.save = function (store, object) {
    var hash = object.hash;
    var offset = object.hashOffset;
    var h = Math.imul(store.a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);
    var list = store.objects[h >>> store.hashBitsToShift];

    var i;
    for (i = 0; i < list.length; i++) {
        if (GitFile.hashEqual(hash, offset, list[i].hash, list[i].hashOffset)) {
            return list[i];
        }
    }

    store.load++;
    list.push(object);
    if (store.load > 0.75 * store.objects.length) {
        resizeObjects(store);
    }

    return object;
};

Store.get = function (store, hash, offset) {
    var h = Math.imul(store.a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);
    var list = store.objects[h >>> store.hashBitsToShift];

    var i;
    for (i = 0; i < list.length; i++) {
        if (GitFile.hashEqual(hash, offset, list[i].hash, list[i].hashOffset)) {
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
    var hash = GitFile.hashToString(object.hash, object.hashOffset);
    return '#<' + hash.slice(0, 6) + ' ' + clamp(data, 36) + '>';
};

Store.prettyPrint = function (store) {
    var pretty = [];
    var i, j;
    for (i = 0; i < store.objects.length; i++) {
        var list = store.objects[i];
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
