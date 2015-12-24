var GitObject = require('./git-object');
var Sha1 = require('./sha1');

var hexArrayToString = function (array) {
    var str = [];
    for (var i = 0; i < array.length; i++) {
        var hex = '00' + array[i].toString(16);
        str.push(hex.slice(-2));
    }
    return str.join('');
};

var hash = new Uint8Array(20);
var blob = GitObject.stringToBlob('Hello, World!\n');
Sha1.hash(blob, hash, 0);
console.log(hexArrayToString(hash));
