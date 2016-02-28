global.pretty = function (array, start, end) {
    if (arguments.length === 1) {
        start = 0;
        end = array.length;
    } else if (arguments.length === 2) {
        end = start;
        start = array;
        array = global.$;
    }
    if (!(array instanceof Uint8Array)) {
        throw new Error('array must be Uint8Array');
    }
    if (typeof start !== 'number') {
        throw new Error('start must be number');
    }
    if (typeof end !== 'number') {
        throw new Error('end must be number');
    }
    var pretty = [];
    var i;
    for (i = start; i < end; i++) {
        if (array[i] === 0x0a || array[i] === 0x20 || array[i] === 0x22 || (0x2b <= array[i] && array[i] <= 0x7a)) {
            pretty.push(String.fromCharCode(array[i]));
        } else {
            pretty.push('\\x' + ('00' + array[i].toString(16)).slice(-2));
        }
    }
    return pretty.join('');
};

global.hex = function (array, start, end) {
    if (arguments.length === 1) {
        start = 0;
        end = array.length;
    } else if (arguments.length === 2) {
        end = start;
        start = array;
        array = global.$;
    }
    if (!(array instanceof Uint8Array)) {
        throw new Error('array must be Uint8Array');
    }
    if (typeof start !== 'number') {
        throw new Error('start must be number');
    }
    if (typeof end !== 'number') {
        throw new Error('end must be number');
    }
    var hex = [];
    var i;
    for (i = start; i < end; i++) {
        hex.push(('00' + array[i].toString(16)).slice(-2));
    }
    return hex.join('');
};

global.hash = function (array, hashOffset) {
    if (arguments.length === 1) {
        hashOffset = array;
        array = global.$;
    }
    return hex(array, hashOffset, hashOffset + 20);
};
