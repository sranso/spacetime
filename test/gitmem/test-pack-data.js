'use strict';
require('../helper');

global.$Heap = Heap.create(512);
global.$ = $Heap.array;

var blobRange = Blob.createFromString('foo bar\n');
var blobStart = blobRange[0];
var blobEnd = blobRange[1];
var blob = $.subarray(blobStart, blobEnd);

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

var offset = PackData.packFile(packData, blobStart, blobEnd);
log(offset, packData.nextOffset, packData.capacity);
//=> 0 17 32
log(hex(packData.array, offset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4

var offset = PackData.packFile(packData, blobStart, blobEnd);
log(offset, packData.nextOffset, packData.capacity);
//=> 17 34 64
log(hex(packData.array, offset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4






var file = PackData.extractFile(packData, packData.array, offset, $Heap);
var fileStart = file[0];
var fileEnd = file[1];
var nextPackOffset = file[2];
log(fileStart, fileEnd, nextPackOffset);
//=> 15 30 34
log(pretty($, fileStart, fileEnd));
//=> blob 8\x00foo bar
//=>
