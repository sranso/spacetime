'use strict';
require('../helper');

global.$Heap = Heap.create(512);
var $h = $Heap.array;

Blob.initialize();
Tree.initialize();


log(pretty($h, Tree.emptyStart, Tree.emptyEnd));
//=> tree 34\x00100644 .empty\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91
log(hash($h, Tree.emptyHashOffset));
//=> 70bfe9793f3fc43d2a2306a58186fe0c88b86999

log(pretty($h, Tree._actuallyEmptyStart, Tree._actuallyEmptyEnd));
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
//=> 153 253
log(pretty($h, treeStart, treeEnd));
//=> tree 92\x0040000 bar\x00p\xbf\xe9y??\xc4=\x2a\x23\x06\xa5\x81\x86\xfe\x0c\x88\xb8i\x99100644 foo\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91100644 www\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91
log(offsets.bar, offsets.foo, offsets.www);
//=> 18 49 80
log(hash($h, treeStart + offsets.bar));
//=> 70bfe9793f3fc43d2a2306a58186fe0c88b86999
log(hash($h, treeStart + offsets.foo));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391
log(hash($h, treeStart + offsets.www));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391


var fooStart = $Heap.nextOffset;
Convert.stringToExistingArray($h, fooStart, 'foo');
$Heap.nextOffset += 3;

Sha1.hash($h, fooStart, $Heap.nextOffset, $h, treeStart + offsets.foo);
log(hash($h, treeStart + offsets.foo));
//=> 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33


var barStart = $Heap.nextOffset;
Convert.stringToExistingArray($h, barStart, 'bar');
$Heap.nextOffset += 3;
var barHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($h, barStart, $Heap.nextOffset, $h, barHashOffset);
log(hash($h, barHashOffset));
//=> ab48e8a80caa10695287570c66633692b2058b77
Tree.setHash($h, treeStart + offsets.bar, $h, barHashOffset);
log(hash($h, treeStart + offsets.bar));
//=> ab48e8a80caa10695287570c66633692b2058b77


log(prettyTree($h, treeStart, treeEnd));
//=> 040000 tree ab48e8a80caa10695287570c66633692b2058b77    bar
//=> 100644 blob 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33    foo
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    www
