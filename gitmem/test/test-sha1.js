'use strict';
require('../../test/helper');

var heapArray = new Uint8Array(200);
var $h = heapArray;

var abc = 'abc';
var abcStart = 5;
var abcEnd = abcStart + abc.length;
var hashOffset = 12;
Convert.stringToExistingArray($h, abcStart, abc);
Sha1.hash($h, abcStart, abcEnd, $h, hashOffset);
log('abc', hexHash($h, hashOffset));
//=> abc a9993e364706816aba3e25717850c26c9cd0d89d

var blah = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
var blahStart = 30;
var blahEnd = blahStart + blah.length;
hashOffset = blahEnd + 30;
Convert.stringToExistingArray($h, blahStart, blah);
Sha1.hash($h, blahStart, blahEnd, $h, hashOffset);
log('abcdbc... blah', hexHash($h, hashOffset));
//=> abcdbc... blah 84983e441c3bd26ebaae4aa1f95129e5e54670f1

var foo = Convert.stringToArray('foo');
var hashArray = new Uint8Array(25);
Sha1.hash(foo, 0, foo.length, hashArray, 5);
log(hexHash(hashArray, 5));
//=> 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33
