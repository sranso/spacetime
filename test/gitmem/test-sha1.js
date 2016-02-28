'use strict';
require('../helper');

global.$ = new Uint8Array(200);

var abc = 'abc';
var abcStart = 5;
var abcEnd = abcStart + abc.length;
var hashOffset = 12;
GitConvert.stringToExistingArray($, abcStart, abc);
Sha1.hash($, abcStart, abcEnd, hashOffset);
log('abc', hash(hashOffset));
//=> abc a9993e364706816aba3e25717850c26c9cd0d89d

var blah = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
var blahStart = 30;
var blahEnd = blahStart + blah.length;
hashOffset = blahEnd + 30;
GitConvert.stringToExistingArray($, blahStart, blah);
Sha1.hash($, blahStart, blahEnd, hashOffset);
log('abcdbc... blah', hash(hashOffset));
//=> abcdbc... blah 84983e441c3bd26ebaae4aa1f95129e5e54670f1
