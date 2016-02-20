'use strict';
require('../helper');

log(GitConvert.stringToArray('Foo'));
//=> Uint8Array { '0': 70, '1': 111, '2': 111 }

var hash = new Uint8Array(20);
Sha1.hash(GitConvert.stringToArray('abc'), hash, 0);
log(GitConvert.hashToString(hash, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hex = new Uint8Array(40);
GitConvert.hashToHex(hash, 0, hex, 0);
log(pretty(hex));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hashBack = new Uint8Array(20);
GitConvert.hexToHash(hex, 0, hashBack, 0);
log(GitConvert.hashToString(hashBack, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

log(GitConvert.hashEqual(hash, 0, hash, 0));
//=> true
log(GitConvert.hashEqual(hash, 0, hash.slice(), 0));
//=> true

var file = new Uint8Array(30);
GitConvert.setHash(file, 10, hash, 0);
log(GitConvert.hashToString(file.subarray(10), 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var packetLength = GitConvert.stringToArray('1ed8');
log(GitConvert.packetLength(packetLength, 0));
//=> 7896
