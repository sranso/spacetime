'use strict';
require('../../test/helper');

global.$fileCache = FileCache.create(6, 256);
global.$heap = Heap.create(256);
var $h = $heap.array;

Blob.initialize();


var offsets = {};
var treeRange = Tree.create({}, offsets, []);
var treeStart = treeRange[0];
var treeEnd = treeRange[1];
log(treeStart, treeEnd);
//=> 7 14
log(pretty($fileCache.array, treeStart, treeEnd));
//=> tree 0\x00
var hashArray = new Uint8Array(20);
Sha1.hash($fileCache.array, treeStart, treeEnd, hashArray, 0);
log(hash(hashArray, 0));
//=> 4b825dc642cb6eb9a060e54bf8d69288fbee4904


offsets = {};
treeRange = Tree.create({
    foo: 'blob',
    bar: 'tree',
    www: 'blob',
}, offsets, []);
treeStart = treeRange[0];
treeEnd = treeRange[1];
log(treeStart, treeEnd);
//=> 14 114
log(pretty($fileCache.array, treeStart, treeEnd));
//=> tree 92\x0040000 bar\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00100644 foo\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00100644 www\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00
log(offsets.bar, offsets.foo, offsets.www);
//=> 18 49 80
log(hash($fileCache.array, treeStart + offsets.bar));
//=> 0000000000000000000000000000000000000000
log(hash($fileCache.array, treeStart + offsets.foo));
//=> 0000000000000000000000000000000000000000
log(hash($fileCache.array, treeStart + offsets.www));
//=> 0000000000000000000000000000000000000000


var fooStart = $heap.nextOffset;
Convert.stringToExistingArray($h, fooStart, 'foo');
$heap.nextOffset += 3;

Sha1.hash($h, fooStart, $heap.nextOffset, $fileCache.array, treeStart + offsets.foo);
log(hash($fileCache.array, treeStart + offsets.foo));
//=> 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33


var barStart = $heap.nextOffset;
Convert.stringToExistingArray($h, barStart, 'bar');
$heap.nextOffset += 3;
var barHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($h, barStart, $heap.nextOffset, $h, barHashOffset);
log(hash($h, barHashOffset));
//=> ab48e8a80caa10695287570c66633692b2058b77
Tree.setHash($fileCache.array, treeStart + offsets.bar, $h, barHashOffset);
log(hash($fileCache.array, treeStart + offsets.bar));
//=> ab48e8a80caa10695287570c66633692b2058b77


log(prettyTree($fileCache.array, treeStart, treeEnd));
//=> 040000 tree ab48e8a80caa10695287570c66633692b2058b77    bar
//=> 100644 blob 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33    foo
//=> 100644 blob 0000000000000000000000000000000000000000    www
