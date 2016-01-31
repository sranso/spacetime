#!/usr/bin/env node
var fs = require('fs');
var zlib = require('zlib');

var compressed = fs.readFileSync(process.argv[2]);
var raw = zlib.unzipSync(compressed);
var pretty = [];

var i;
if (process.argv[3] === 'compressed') {
    for (i = 0; i < compressed.length; i++) {
        pretty.push(('00' + compressed[i].toString(16)).slice(-2));
    }
} else if (process.argv[3] === 'raw') {
    for (i = 0; i < raw.length; i++) {
        pretty.push(('00' + raw[i].toString(16)).slice(-2));
    }
} else {
    for (i = 0; i < raw.length; i++) {
        var c = raw[i];
        if (c == 10 || 32 <= c && c <= 122) {
            pretty.push(String.fromCharCode(c));
        } else {
            pretty.push('\\x' + ('00' + c.toString(16)).slice(-2));
        }
    };
}

process.stdout.write(pretty.join(''));
