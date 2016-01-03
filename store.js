'use strict';
var Store = {};
module.exports = Store;
var GitFile = require('./git-file');
(function () {

var hashBitsToShift = 32;
var objects = Store._objects = [[]];
var load = 0;
var al = 2 * Math.floor(Math.random() * Math.pow(2, 15)) + 1;
var ah = Math.floor(Math.random() * Math.pow(2, 16));

var resizeObjects = function () {
    hashBitsToShift -= 1;
    var newObjects = new Array(objects.length * 2);

    var i, j;
    for (i = 0; i < newObjects.length; i += 2) {
        newObjects[i] = [];
        newObjects[i + 1] = [];
        var oldList = objects[i >> 1];
        for (j = 0; j < oldList.length; j++) {
            var object = oldList[j];
            var hash = object.hash;
            var offset = object.hashOffset;
            var hl = (hash[offset + 2] << 8) | hash[offset + 3];
            var hh = (hash[offset] << 8) | hash[offset + 1];
            var h = (((hh * al + hl * ah) & 0xffff) << 16) | ((hl * al) & 0xffff);

            newObjects[h >>> hashBitsToShift].push(object);
        }
    }
    objects = Store._objects = newObjects;
};

while (objects.length < 4) {
    resizeObjects();
}

Store.save = function (object) {
    var hash = object.hash;
    var offset = object.hashOffset;
    var hl = (hash[offset + 2] << 8) | hash[offset + 3];
    var hh = (hash[offset] << 8) | hash[offset + 1];
    var h = (((hh * al + hl * ah) & 0xffff) << 16) | ((hl * al) & 0xffff);
    var list = objects[h >>> hashBitsToShift];

    var i;
    for (i = 0; i < list.length; i++) {
        if (GitFile.hashEqual(hash, offset, list[i].hash, list[i].hashOffset)) {
            return list[i];
        }
    }

    load++;
    list.push(object);
    if (load > 0.75 * objects.length) {
        resizeObjects();
    }

    return object;
};

Store.get = function (hash, offset) {
    var hl = (hash[offset + 2] << 8) | hash[offset + 3];
    var hh = (hash[offset] << 8) | hash[offset + 1];
    var h = (((hh * al + hl * ah) & 0xffff) << 16) | ((hl * al) & 0xffff);
    var list = objects[h >>> hashBitsToShift];

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

})();
