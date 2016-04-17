'use strict';
require('../../test/helper');

global.$fileCache = FileCache.create(3, 32);

var blobRange = Blob.create('foo', []);
var blobStart = blobRange[0];
var blobEnd = blobRange[1];
log(blobStart, blobEnd);
//=> 0 10
log(pretty($fileCache.array, blobStart, blobEnd));
//=> blob 3\x00foo
var contentStart = Blob.contentStart($fileCache.array, blobStart);
//=> 7
log(pretty($fileCache.array, contentStart, blobEnd));
//=> foo

blobRange = Blob.create('', []);
blobStart = blobRange[0];
blobEnd = blobRange[1];
log(pretty($fileCache.array, blobStart, blobEnd));
//=> blob 0\x00
var hashArray = new Uint8Array(20);
Sha1.hash($fileCache.array, blobStart, blobEnd, hashArray, 0);
log(hash(hashArray, 0));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391

blobRange = Blob.create('bar', []);
blobStart = blobRange[0];
blobEnd = blobRange[1];
log(blobStart, blobEnd);
//=> 17 27
log(pretty($fileCache.array, blobStart, blobEnd));
//=> blob 3\x00bar
