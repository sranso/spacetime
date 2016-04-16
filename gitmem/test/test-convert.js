'use strict';
require('../../test/helper');

log(Convert.stringToArray('Foo'));
//=> Uint8Array { '0': 70, '1': 111, '2': 111 }

var array = new Uint8Array(10);
Convert.stringToExistingArray(array, 2, 'foo bar');
log(pretty(array));
//=> \x00\x00foo bar\x00

var fromArray = Convert.stringToArray('Foo Bar');
Convert.arrayToExistingArray(array, 1, fromArray);
log(pretty(array));
//=> \x00Foo Barr\x00

var hashArray = new Uint8Array([0xa9,0x99,0x3e,0x36,0x47,0x06,0x81,0x6a,0xba,0x3e,0x25,0x71,0x78,0x50,0xc2,0x6c,0x9c,0xd0,0xd8,0x9d]);
log(Convert.hashToString(hashArray, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hexArray = new Uint8Array(40);
Convert.hashToHex(hashArray, 0, hexArray, 0);
log(pretty(hexArray));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var hashBack = new Uint8Array(20);
Convert.hexToHash(hexArray, 0, hashBack, 0);
log(Convert.hashToString(hashBack, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var pktLine = Convert.stringToArray('1ed8');
log(Convert.pktLineToLength(pktLine, 0));
//=> 7896
