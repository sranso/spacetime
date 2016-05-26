'use strict';
require('../../test/helper');

global.$file = new Uint8Array(512);
global.$pack = new Uint8Array(1024);
global.$table = Table.create(4, Random.create(19223554));

var blobLength = Blob.create($file, 'foo bar\n');
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
log(packOffset);
//=> 17
log(hex($pack, 0, packOffset));
//=> 38789c4bcbcf57484a2ce202000d1402a4

var newPackOffset = PackData.packFile(packOffset, $file, 0, blobLength);
log(newPackOffset);
//=> 34
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


var baseText = hash('a bit of text that hopefully causes some\n' +
                    'IT DID\n' +
                    'delta compression when we change it below\n');
log(hexHash($table.hashes8, baseText));
//=> dbb16741a33f67e17ae6abd9cd9ede3ecde4cce9

// Constructed with web-test-local-git.js and git 2.6.4
var pack = new Uint8Array([0x77,0xdb,0xb1,0x67,0x41,0xa3,0x3f,0x67,0xe1,0x7a,0xe6,0xab,0xd9,0xcd,0x9e,0xde,0x3e,0xcd,0xe4,0xcc,0xe9,0x78,0x9c,0x8b,0x0e,0x99,0xa0,0x35,0xd1,0x50,0x0b,0x00,0x0a,0x33,0x02,0x56]);

PackData.extractFile(pack, 0, extractFileOutput);
var fileLength = extractFileOutput[0];
var nextPackOffset = extractFileOutput[1];
log(fileLength, nextPackOffset);
//=> 91 36
log(pretty($file, 0, fileLength));
//=> blob 0\x00"a bit of text that hopefully causes some
//=> delta compression when we change it below
//=>
