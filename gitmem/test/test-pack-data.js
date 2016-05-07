'use strict';
require('../../test/helper');

global.$heap = Heap.create(64);
var $h = $heap.array;
global.$fileCache = FileCache.create(2, 32);

var blobRange = Blob.create('foo bar\n', []);
var blobStart = blobRange[0];
var blobEnd = blobRange[1];
var blob = $fileCache.array.subarray(blobStart, blobEnd);

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
log(packData.nextOffset, packData.array.length);
//=> 0 32

var packOffset = PackData.packFile(packData, $fileCache.array, blobStart, blobEnd);
log(packOffset, packData.nextOffset, packData.array.length);
//=> 0 17 32
log(hex(packData.array, packOffset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4

packOffset = PackData.packFile(packData, $fileCache.array, blobStart, blobEnd);
log(packOffset, packData.nextOffset, packData.array.length);
//=> 17 34 64
log(hex(packData.array, packOffset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4






var fileRange = [];
$fileCache.array[21] = 42; // This is where the NUL byte will go
var nextPackOffset = PackData.extractFile(packData.array, packOffset, fileRange);
var fileStart = fileRange[0];
var fileEnd = fileRange[1];
log(fileStart, fileEnd, nextPackOffset);
//=> 15 30 34
log($fileCache.nextArrayOffset);
//=> 30
log(pretty($fileCache.array, fileStart, fileEnd));
//=> blob 8\x00foo bar
//=>