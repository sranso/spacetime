'use strict';
require('../helper');

var actuallyEmptyHash = new Uint8Array(20);
Sha1.hash(Tree._actuallyEmptyTree, actuallyEmptyHash, 0);
log(hex(Tree._actuallyEmptyTreeHash));
//=> 4b825dc642cb6eb9a060e54bf8d69288fbee4904

log(GitConvert.hashEqual(actuallyEmptyHash, 0, Tree._actuallyEmptyTreeHash, 0));
//=> true

log(pretty(Tree.emptyTree));
//=> tree 34\x00100644 .empty\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91
log(Tree.catFile(Tree.emptyTree));
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    .empty
log(hex(Tree.emptyTreeHash));
//=> 70bfe9793f3fc43d2a2306a58186fe0c88b86999

var offsets = {};
var file = Tree.createSkeleton(offsets, {});
log('empty skeleton file:\n' + Tree.catFile(file));
//=> empty skeleton file:
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    .empty

var hashAt = function (i) {
    return GitConvert.hashToString(file, i);
};

file = Tree.createSkeleton(offsets, {
    foo: 'blob',
});

file = Tree.addProperty(file, offsets, 'bar', 'tree');
file = Tree.addProperty(file, offsets, 'www', 'blob');
log(pretty(file));
//=> tree 92\x0040000 bar\x00p\xbf\xe9y??\xc4=\x2a\x23\x06\xa5\x81\x86\xfe\x0c\x88\xb8i\x99100644 foo\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91100644 www\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91
log(Tree.catFile(file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    bar
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    foo
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    www
log(offsets.bar, offsets.foo, offsets.www);
//=> 18 49 80
log(hashAt(offsets.bar), hashAt(offsets.foo), hashAt(offsets.www));
//=> 70bfe9793f3fc43d2a2306a58186fe0c88b86999 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391

file = Tree.createSkeleton(offsets, {
    foo: 'blob',
});
file = Tree.addProperty(file, offsets, 'food', 'blob');
file = Tree.addProperty(file, offsets, 'fo', 'tree');
var helloHash = new Uint8Array(20);
var helloWorldBlob = Blob.createFromString('Hello, World!');
Sha1.hash(helloWorldBlob, helloHash, 0);
log(hex(helloHash));
//=> b45ef6fec89518d314f546fd6c3025367b721684
GitConvert.setHash(file, offsets.foo, helloHash, 0);
log(Tree.catFile(file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    fo
//=> 100644 blob b45ef6fec89518d314f546fd6c3025367b721684    foo
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    food
log(GitConvert.hashToString(file, offsets.foo));
//=> b45ef6fec89518d314f546fd6c3025367b721684

file = Tree.createSkeleton(offsets, {
    food: 'blob',
    bar: 'tree',
    bazzle: 'blob',
});
log(Tree.catFile(file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    bar
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    bazzle
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    food

log(hashAt(offsets.food));
//=> e69de29bb2d1d6434b8b29ae775ad8c2e48c5391
