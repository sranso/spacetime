'use strict';
require('../helper');

var hash = new Uint8Array(20);

var abc = 'abc';
var abcArray = GitConvert.stringToArray(abc);
Sha1.hash(abcArray, hash, 0);
log('abc', hex(hash));
//=> abc a9993e364706816aba3e25717850c26c9cd0d89d

var blah = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
var blahArray = GitConvert.stringToArray(blah);
Sha1.hash(blahArray, hash, 0);
log('abcdbc... blah', hex(hash));
//=> abcdbc... blah 84983e441c3bd26ebaae4aa1f95129e5e54670f1
