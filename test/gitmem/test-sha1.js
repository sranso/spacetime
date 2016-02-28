'use strict';
require('../helper');

global.$ = new Uint8Array(200);

var abc = 'abc';
var abcBegin = 5;
var abcEnd = abcBegin + abc.length;
var hashOffset = 12;
GitConvert.stringToExistingArray($, abcBegin, abc);
Sha1.hash($, abcBegin, abcEnd, hashOffset);
log('abc', hash(hashOffset));
//=> abc a9993e364706816aba3e25717850c26c9cd0d89d

var blah = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
var blahBegin = 30;
var blahEnd = blahBegin + blah.length;
hashOffset = blahEnd + 30;
GitConvert.stringToExistingArray($, blahBegin, blah);
Sha1.hash($, blahBegin, blahEnd, hashOffset);
log('abcdbc... blah', hash(hashOffset));
//=> abcdbc... blah 84983e441c3bd26ebaae4aa1f95129e5e54670f1
