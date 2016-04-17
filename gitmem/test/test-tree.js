'use strict';
require('../../test/helper');

global.$fileCache = FileCache.create(6, 256);

treeRange = Tree.create({
    foo: 'blob',
    bar: 'tree',
    www: 'blob',
}, []);
treeStart = treeRange[0];
treeEnd = treeRange[1];
log(treeStart, treeEnd);
//=> 7 107
log(pretty($fileCache.array, treeStart, treeEnd));
//=> tree 92\x0040000 bar\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00100644 foo\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00100644 www\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00

var offsets = {
    bar: 18,
    foo: 49,
};
log(hash($fileCache.array, treeStart + offsets.bar));
//=> 0000000000000000000000000000000000000000
log(hash($fileCache.array, treeStart + offsets.foo));
//=> 0000000000000000000000000000000000000000


var foo = Convert.stringToArray('foo');

Sha1.hash(foo, 0, foo.length, $fileCache.array, treeStart + offsets.foo);
log(hash($fileCache.array, treeStart + offsets.foo));
//=> 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33


var bar = Convert.stringToArray('bar');
var barHash = new Uint8Array(20);
Sha1.hash(bar, 0, bar.length, barHash, 0);
log(hash(barHash, 0));
//=> 62cdb7020ff920e5aa642c3d4066950dd1f01f4d
Tree.setHash($fileCache.array, treeStart + offsets.bar, barHash, 0);
log(hash($fileCache.array, treeStart + offsets.bar));
//=> 62cdb7020ff920e5aa642c3d4066950dd1f01f4d


log(prettyTree($fileCache.array, treeStart, treeEnd));
//=> 040000 tree 62cdb7020ff920e5aa642c3d4066950dd1f01f4d    bar
//=> 100644 blob 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33    foo
//=> 100644 blob 0000000000000000000000000000000000000000    www
