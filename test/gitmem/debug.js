'use strict';
(function () {

global.pretty = function (array, start, end) {
    if (!(array instanceof Uint8Array)) {
        throw new Error('array must be Uint8Array');
    }
    if (arguments.length >= 2 && typeof start !== 'number') {
        throw new Error('start must be a number');
    }
    if (arguments.length >= 3 && typeof end !== 'number') {
        throw new Error('end must be a number');
    }

    array = array.subarray(start, end);
    var pretty = [];
    var i;
    for (i = 0; i < array.length; i++) {
        if (array[i] === 0x0a || array[i] === 0x20 || array[i] === 0x22 || (0x2b <= array[i] && array[i] <= 0x7a)) {
            pretty.push(String.fromCharCode(array[i]));
        } else {
            pretty.push('\\x' + ('00' + array[i].toString(16)).slice(-2));
        }
    }
    return pretty.join('');
};

global.hex = function (array, start, end) {
    if (!(array instanceof Uint8Array)) {
        throw new Error('array must be Uint8Array');
    }
    if (arguments.length >= 2 && typeof start !== 'number') {
        throw new Error('start must be a number');
    }
    if (arguments.length >= 3 && typeof end !== 'number') {
        throw new Error('end must be a number');
    }
    array = array.subarray(start, end);
    var hex = [];
    var i;
    for (i = 0; i < array.length; i++) {
        hex.push(('00' + array[i].toString(16)).slice(-2));
    }
    return hex.join('');
};

global.hash = function (array, hashOffset) {
    if (typeof hashOffset !== 'number') {
        throw new Error('hashOffset must be a number');
    }
    return hex(array, hashOffset, hashOffset + 20);
};

global.prettyObjectList = function (objects) {
    var pretty = [];
    var i;
    for (i = 0; i < objects.length; i++) {
        var object = objects[i];
        if (object) {
            var value;
            if (object.hasOwnProperty('value')) {
                value = '' + object.value;
            } else {
                var keys = Object.keys(object);
                var ignoreKeys = ['flags', 'fileStart', 'fileEnd', 'hashOffset'];
                keys = keys.filter(function (key) {
                    return ignoreKeys.indexOf(key) === -1;
                });
                value = keys.map(function (key) {
                    var d = '' + object[key];
                    return clamp(key, 6) + '=' + clamp(d, 6);
                }).join(' ');
            }
            var hash = Convert.hashToString($HashTable.hashes, object.hashOffset);
            pretty.push(i + ': #<' + hash.slice(0, 6) + ' ' + clamp(value, 36) + '>');
        }
    }

    return pretty.join('\n');
};

var clamp = function (d, length) {
    if (d.length > length) {
        return d.slice(0, length - 2) + '..';
    } else {
        return d;
    }
};

global.prettyTree = function ($t, treeStart, treeEnd) {
    var pretty = [];
    var j = $t.indexOf(0, treeStart + 6) + 1;
    while (j < treeEnd) {
        var modeEnd = $t.indexOf(0x20, j + 5);
        var filenameEnd = $t.indexOf(0, modeEnd + 2);

        var mode = String.fromCharCode.apply(null, $t.subarray(j, modeEnd));
        if (mode === '100644') {
            var type = 'blob';
        } else if (mode === '40000') {
            mode = '040000';
            var type = 'tree';
        } else {
            var type = 'unknown';
        }

        j = modeEnd + 1;
        var filename = String.fromCharCode.apply(null, $t.subarray(j, filenameEnd));

        j = filenameEnd + 1;
        var hash = Convert.hashToString($t, j);
        pretty.push([mode, type, hash, '  ', filename].join(' '));

        j += 20;
    }

    return pretty.join('\n');
};

})();
