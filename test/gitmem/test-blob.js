'use strict';
require('../helper');

global.$Heap = Heap.create(512);
global.$ = $Heap.array;

var blobRange = Blob.createFromString('foo');
var blobBegin = blobRange[0];
var blobEnd = blobRange[1];
log(blobRange, blobBegin, blobEnd);
//=> [ 0, 10 ] 0 10
log(pretty(blobBegin, blobEnd));
//=> blob 3\x00foo
var contentBegin = Blob.contentBegin(blobBegin);
//=> 7
log(GitConvert.arraySliceToString($, contentBegin, blobEnd));
//=> foo


Blob.initialize();
log(Blob.emptyBegin, Blob.emptyEnd);
//=> 10 17
log(pretty(Blob.emptyBegin, Blob.emptyEnd));
//=> blob 0\x00
log(Blob.emptyHashOffset);
//=> 17
log(hash(Blob.emptyHashOffset));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391
