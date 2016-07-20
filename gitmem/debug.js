'use strict';
(function () {

if (!global.log) {
    global.log = function () {
        return console.log(console, arguments);
    };
}

global.pretty = function (array, start, end) {
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
    array = array.subarray(start, end);
    var hex = [];
    var i;
    for (i = 0; i < array.length; i++) {
        hex.push(('00' + array[i].toString(16)).slice(-2));
    }
    return hex.join('');
};

global.hexHash = function (array, hashOffset) {
    if (typeof hashOffset !== 'number') {
        throw new Error('hashOffset must be a number');
    }
    return hex(array, hashOffset, hashOffset + 20);
};

var clamp = function (d, length) {
    if (d.length > length) {
        return d.slice(0, length - 2) + '..';
    } else {
        return d;
    }
};

})();
