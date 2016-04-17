'use strict';
require('../../test/helper');

global.$fileCache = FileCache.create(6, 256);
global.$heap = Heap.create(256);
var $h = $heap.array;

Blob.initialize();
Tree.initialize();


log(pretty($fileCache.array, Tree.emptyStart, Tree.emptyEnd));
//=> tree 34\x00100644 .empty\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91
log(hash($h, Tree.emptyHashOffset));
//=> 70bfe9793f3fc43d2a2306a58186fe0c88b86999

log(pretty($fileCache.array, Tree._actuallyEmptyStart, Tree._actuallyEmptyEnd));
//=> tree 0\x00
log(hash($h, Tree._actuallyEmptyHashOffset));
//=> 4b825dc642cb6eb9a060e54bf8d69288fbee4904


var offsets = {};
var treeRange = Tree.create({
    foo: 'blob',
    bar: 'tree',
    www: 'blob',
}, offsets, []);
var treeStart = treeRange[0];
var treeEnd = treeRange[1];
log(treeStart, treeEnd);
//=> 56 156
log(pretty($fileCache.array, treeStart, treeEnd));
//=> tree 92\x0040000 bar\x00p\xbf\xe9y??\xc4=\x2a\x23\x06\xa5\x81\x86\xfe\x0c\x88\xb8i\x99100644 foo\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91100644 www\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91
log(offsets.bar, offsets.foo, offsets.www);
//=> 18 49 80
log(hash($fileCache.array, treeStart + offsets.bar));
//=> 70bfe9793f3fc43d2a2306a58186fe0c88b86999
log(hash($fileCache.array, treeStart + offsets.foo));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391
log(hash($fileCache.array, treeStart + offsets.www));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391


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
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    www
