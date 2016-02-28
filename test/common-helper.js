global.pretty = function (array) {
    if (!(array instanceof Uint8Array)) {
        throw new Error('type must be Uint8Array');
    }
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

global.hex = function (array) {
    if (!(array instanceof Uint8Array)) {
        throw new Error('type must be Uint8Array');
    }
    var hex = [];
    var i;
    for (i = 0; i < array.length; i++) {
        hex.push(('00' + array[i].toString(16)).slice(-2));
    }
    return hex.join('');
};

global.hash = function ($, hashOffset) {
    if (arguments.length === 1) {
        hashOffset = $;
        $ = global.$;
    } else if (!($ instanceof Uint8Array)) {
        throw new Error('type must be Uint8Array');
    }
    if (typeof hashOffset !== 'number') {
        throw new Error('type must be number');
    }
    return hex($.subarray(hashOffset, hashOffset + 20));
};
