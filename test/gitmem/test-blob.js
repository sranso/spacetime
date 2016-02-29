'use strict';
require('../helper');

global.$Heap = Heap.create(512);
global.$ = $Heap.array;

var blobRange = Blob.createFromString('foo');
var blobStart = blobRange[0];
var blobEnd = blobRange[1];
log(blobRange, blobStart, blobEnd);
//=> [ 0, 10 ] 0 10
log(pretty(blobStart, blobEnd));
//=> blob 3\x00foo
var contentStart = Blob.contentStart(blobStart);
//=> 7
log(GitConvert.arraySliceToString($, contentStart, blobEnd));
//=> foo


Blob.initialize();
log(Blob.emptyStart, Blob.emptyEnd);
//=> 84 91
log(pretty(Blob.emptyStart, Blob.emptyEnd));
//=> blob 0\x00
log(Blob.emptyHashOffset);
//=> 64
log(hash(Blob.emptyHashOffset));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391
