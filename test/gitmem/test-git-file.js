var helper = require('../helper');

log(GitFile.stringToArray('Foo'));
//=> Uint8Array { '0': 70, '1': 111, '2': 111 }

var hash = new Uint8Array(20);
Sha1.hash(GitFile.stringToArray('abc'), hash, 0);
log(GitFile.hashToString(hash, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hex = new Uint8Array(40);
GitFile.hashToHex(hash, 0, hex, 0);
log(helper.pretty(hex));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hashBack = new Uint8Array(20);
GitFile.hexToHash(hex, 0, hashBack, 0);
log(GitFile.hashToString(hashBack, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

log(GitFile.hashEqual(hash, 0, hash, 0));
//=> true
log(GitFile.hashEqual(hash, 0, hash.slice(), 0));
//=> true

var file = new Uint8Array(30);
GitFile.setHash(file, 10, hash, 0);
log(GitFile.hashToString(file.subarray(10), 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d
