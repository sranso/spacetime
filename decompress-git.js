var fs = require('fs');
var zlib = require('zlib');

var compressed = fs.readFileSync(process.argv[2]);
var raw = zlib.unzipSync(compressed);
var pretty = [];

var i, c;
for (i = 0; i < raw.length; i++) {
    c = raw[i];
    if (32 <= c && c <= 122) {
        pretty.push(String.fromCharCode(c));
    } else {
        pretty.push('\\x' + ('00' + c.toString(16)).slice(-2));
    }
};
process.stdout.write(pretty.join(''));
