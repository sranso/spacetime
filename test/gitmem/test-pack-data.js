'use strict';
require('../helper');

global.$Heap = Heap.create(64);
var $h = $Heap.array;

var blobRange = Blob.create('foo bar\n', []);
var blobStart = blobRange[0];
var blobEnd = blobRange[1];
var blob = $h.subarray(blobStart, blobEnd);

var deflated = pako.deflate(blob, {level: 1, chunkSize: 4096});
log(hex(deflated));
//=> 78014bcac94f52b06048cbcf57484a2ce20200268c049b
log(deflated.length);
//=> 23

var inflate = new pako.Inflate({chunkSize: 4096});
inflate.push(deflated);
log(pretty(inflate.result));
//=> blob 8\x00foo bar
//=>
log(inflate.strm.next_in);
//=> 23



var packData = PackData.create(32);
log(packData.nextOffset, packData.capacity);
//=> 0 32

var packOffset = PackData.packFile(packData, $h, blobStart, blobEnd);
log(packOffset, packData.nextOffset, packData.capacity);
//=> 0 17 32
log(hex(packData.array, packOffset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4

packOffset = PackData.packFile(packData, $h, blobStart, blobEnd);
log(packOffset, packData.nextOffset, packData.capacity);
//=> 17 34 64
log(hex(packData.array, packOffset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4






var fileRange = [];
var nextPackOffset = PackData.extractFile(packData, packData.array, packOffset, $Heap, fileRange);
var fileStart = fileRange[0];
var fileEnd = fileRange[1];
log(fileStart, fileEnd, nextPackOffset);
//=> 15 30 34
log(pretty($h, fileStart, fileEnd));
//=> blob 8\x00foo bar
//=>
