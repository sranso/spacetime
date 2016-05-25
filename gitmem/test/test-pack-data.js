'use strict';
require('../../test/helper');

global.$file = new Uint8Array(16);
global.$pack = new Uint8Array(64);

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



var packOffset = 0;
packOffset = PackData.packFile(packOffset, $file, 0, blobLength);
log(packOffset, $pack.length);
//=> 17 64
log(hex($pack, 0, packOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4

var newPackOffset = PackData.packFile(packOffset, $file, 0, blobLength);
log(newPackOffset, $pack.length);
//=> 34 64
log(hex($pack, packOffset, newPackOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4






$file[6] = 123; // This is where the NUL byte will go
var extractFileOutput = [];
PackData.extractFile($pack, packOffset, extractFileOutput);
var fileLength = extractFileOutput[0];
var nextPackOffset = extractFileOutput[1];
log(fileLength, nextPackOffset);
//=> 15 34
log(pretty($file, 0, fileLength));
//=> blob 8\x00foo bar
//=>
