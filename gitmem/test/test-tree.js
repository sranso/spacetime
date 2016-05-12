'use strict';
require('../../test/helper');

global.$file = new Uint8Array(128);

var treeLength = Tree.create({
    foo: 'blob',
    bar: 'tree',
    www: 'blob',
});
log(treeLength);
//=> 100
log(pretty($file, 0, treeLength));
//=> tree 92\x0040000 bar\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00100644 foo\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00100644 www\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00

var offsets = {
    bar: 18,
    foo: 49,
};
log(hexHash($file, offsets.bar));
//=> 0000000000000000000000000000000000000000
log(hexHash($file, offsets.foo));
//=> 0000000000000000000000000000000000000000


var foo = Convert.stringToArray('foo');

Sha1.hash(foo, 0, foo.length, $file, offsets.foo);
log(hexHash($file, offsets.foo));
//=> 0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33


var bar = Convert.stringToArray('bar');
var barHash = new Uint8Array(20);
Sha1.hash(bar, 0, bar.length, barHash, 0);
log(hexHash(barHash, 0));
//=> 62cdb7020ff920e5aa642c3d4066950dd1f01f4d
Tree.setHash($file, offsets.bar, barHash, 0);
log(hexHash($file, offsets.bar));
//=> 62cdb7020ff920e5aa642c3d4066950dd1f01f4d

log(pretty($file, 0, treeLength));
//=> tree 92\x0040000 bar\x00b\xcd\xb7\x02\x0f\xf9 \xe5\xaad,=@f\x95\x0d\xd1\xf0\x1fM100644 foo\x00\x0b\xee\xc7\xb5\xea?\x0f\xdb\xc9]\x0d\xd4\x7f<[\xc2u\xda\x8a3100644 www\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00
