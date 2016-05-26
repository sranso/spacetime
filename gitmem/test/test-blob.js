'use strict';
require('../../test/helper');

global.$file = new Uint8Array(512);

var blobLength = Blob.create('foo');
log(blobLength);
//=> 10
log(pretty($file, 0, blobLength));
//=> blob 3\x00foo

blobLength = Blob.create('');
log(pretty($file, 0, blobLength));
//=> blob 0\x00
var hashArray = new Uint8Array(20);
Sha1.hash($file, 0, blobLength, hashArray, 0);
log(hexHash(hashArray, 0));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391

blobLength = Blob.create('bar');
log(blobLength);
//=> 10
log(pretty($file, 0, blobLength));
//=> blob 3\x00bar
