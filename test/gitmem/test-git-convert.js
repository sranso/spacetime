'use strict';
require('../helper');

log(GitConvert.stringToArray('Foo'));
//=> Uint8Array { '0': 70, '1': 111, '2': 111 }

var array = new Uint8Array(10);
GitConvert.stringToExistingArray(array, 2, 'foo bar');
log(pretty(array));
//=> \x00\x00foo bar\x00

var hashArray = new Uint8Array([0xa9,0x99,0x3e,0x36,0x47,0x06,0x81,0x6a,0xba,0x3e,0x25,0x71,0x78,0x50,0xc2,0x6c,0x9c,0xd0,0xd8,0x9d]);
log(GitConvert.hashToString(hashArray, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hexArray = new Uint8Array(40);
GitConvert.hashToHex(hashArray, 0, hexArray, 0);
log(pretty(hexArray));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hashBack = new Uint8Array(20);
GitConvert.hexToHash(hexArray, 0, hashBack, 0);
log(GitConvert.hashToString(hashBack, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

log(GitConvert.hashEqual(hashArray, 0, hashArray, 0));
//=> true
log(GitConvert.hashEqual(hashArray, 0, hashArray.slice(), 0));
//=> true

var file = new Uint8Array(30);
GitConvert.setHash(file, 10, hashArray, 0);
log(GitConvert.hashToString(file.subarray(10), 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var pktLineLength = GitConvert.stringToArray('1ed8');
log(GitConvert.pktLineLength(pktLineLength, 0));
//=> 7896
