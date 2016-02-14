global.pretty = function (array) {
    var pretty = [];
    var i;
    for (i = 0; i < array.length; i++) {
        if (array[i] === 0x0a || array[i] === 0x20 || (0x2b <= array[i] && array[i] <= 0x7a)) {
            pretty.push(String.fromCharCode(array[i]));
        } else {
            pretty.push('\\x' + ('00' + array[i].toString(16)).slice(-2));
        }
    }
    return pretty.join('');
};

global.hex = function (array) {
    var hex = [];
    var i;
    for (i = 0; i < array.length; i++) {
        hex.push(('00' + array[i].toString(16)).slice(-2));
    }
    return hex.join('');
};
