'use strict';
require('../helper');

global.$FileCache = FileCache.create(3, 32);
global.$Heap = Heap.create(32);

var blobRange = Blob.create('foo', []);
var blobStart = blobRange[0];
var blobEnd = blobRange[1];
log(blobStart, blobEnd);
//=> 0 10
log(pretty($FileCache.array, blobStart, blobEnd));
//=> blob 3\x00foo
var contentStart = Blob.contentStart($FileCache.array, blobStart);
//=> 7
log(pretty($FileCache.array, contentStart, blobEnd));
//=> foo

Blob.initialize();
log(Blob.emptyHashOffset);
//=> 0
log(hash($Heap.array, Blob.emptyHashOffset));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391

blobRange = Blob.create('bar', []);
blobStart = blobRange[0];
blobEnd = blobRange[1];
log(blobStart, blobEnd);
//=> 17 27
log(pretty($FileCache.array, blobStart, blobEnd));
//=> blob 3\x00bar
