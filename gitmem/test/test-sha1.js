'use strict';
require('../../test/helper');

var abc = Convert.stringToArray('abc');
var abcHash = new Uint8Array(20);
Sha1.hash(abc, 0, abc.length, abcHash, 0);
log(hexHash(abcHash, 0));
//=> a9993e364706816aba3e25717850c26c9cd0d89d

var blah = Convert.stringToArray('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq');
var blahHash = new Uint8Array(20);
Sha1.hash(blah, 0, blah.length, blahHash, 0);
log(hexHash(blahHash, 0));
//=> 84983e441c3bd26ebaae4aa1f95129e5e54670f1

var foo = Convert.stringToArray('foo');
var fooHash = new Uint8Array(20 + 5);
Sha1.hash(foo, 0, foo.length, fooHash, 5);
log(hexHash(fooHash, 5));
//=> 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33
