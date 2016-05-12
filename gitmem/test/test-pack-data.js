'use strict';
require('../../test/helper');

global.$file = new Uint8Array(16);

var blobLength = Blob.create('foo bar\n');
var blob = $file.subarray(0, blobLength);

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

var packOffset = PackData.packFile(packData, $file, 0, blobLength);
log(packOffset, packData.nextOffset, packData.array.length);
//=> 0 17 32
log(hex(packData.array, packOffset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4

packOffset = PackData.packFile(packData, $file, 0, blobLength);
log(packOffset, packData.nextOffset, packData.array.length);
//=> 17 34 64
log(hex(packData.array, packOffset, packData.nextOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4






$file[6] = 123; // This is where the NUL byte will go
var extractFileOutput = [];
PackData.extractFile(packData.array, packOffset, extractFileOutput);
var fileLength = extractFileOutput[0];
var nextPackOffset = extractFileOutput[1];
log(fileLength, nextPackOffset);
//=> 15 34
log(pretty($file, 0, fileLength));
//=> blob 8\x00foo bar
//=>
