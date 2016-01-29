'use strict';
global.Store = {};
(function () {

var hashBitsToShift = 32;
var objectStore = Store._objects = [[]];
var load = 0;
var a;

Store.setup = function () {
    a = Random.rand() | 1;

    Store.save(Store.createBlobObject('', Blob.empty, Blob.emptyHash, 0));
    Store.save(Store.createBlobObject(null, Tree.empty, Tree.emptyHash, 0));
};

var resizeObjects = function () {
    hashBitsToShift -= 1;
    var newStore = new Array(objectStore.length * 2);

    var i, j;
    for (i = 0; i < newStore.length; i += 2) {
        newStore[i] = [];
        newStore[i + 1] = [];
        var oldList = objectStore[i >> 1];
        for (j = 0; j < oldList.length; j++) {
            var object = oldList[j];
            var hash = object.hash;
            var offset = object.hashOffset;
            var h = Math.imul(a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);

            newStore[h >>> hashBitsToShift].push(object);
        }
    }
    objectStore = Store._objects = newStore;
};

while (objectStore.length < 4) {
    resizeObjects();
}

Store.save = function (object) {
    var hash = object.hash;
    var offset = object.hashOffset;
    var h = Math.imul(a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);
    var list = objectStore[h >>> hashBitsToShift];

    var i;
    for (i = 0; i < list.length; i++) {
        if (GitFile.hashEqual(hash, offset, list[i].hash, list[i].hashOffset)) {
            return list[i];
        }
    }

    load++;
    list.push(object);
    if (load > 0.75 * objectStore.length) {
        resizeObjects();
    }

    return object;
};

Store.get = function (hash, offset) {
    var h = Math.imul(a, (hash[offset] << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]);
    var list = objectStore[h >>> hashBitsToShift];

    var i;
    for (i = 0; i < list.length; i++) {
        if (GitFile.hashEqual(hash, offset, list[i].hash, list[i].hashOffset)) {
            return list[i];
        }
    }
    return null;
};

Store.createBlobObject = function (data, file, hash, hashOffset) {
    return {
        data: data,
        file: file,
        hash: hash,
        hashOffset: hashOffset,
    };
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

Store.prettyPrint = function () {
    var pretty = [];
    var i, j;
    for (i = 0; i < objectStore.length; i++) {
        var list = objectStore[i];
        if (list.length) {
            var entries = [];
            for (j = 0; j < list.length; j++) {
                entries.push(prettyPrintObject(list[j]));
            }
            pretty.push(i, ': ', entries.join(', '), '\n');
        }
    }

    return pretty.join('');
};

})();
