var helper = require('../helper');

var actuallyEmptyHash = new Uint8Array(20);
Sha1.hash(Tree._actuallyEmptyTree, actuallyEmptyHash, 0);
log('actually empty tree hash: ' + GitFile.hashToString(actuallyEmptyHash, 0));
//=> actually empty tree hash: 4b825dc642cb6eb9a060e54bf8d69288fbee4904

log('empty tree', GitFile.catFile(Tree.empty));
//=> empty tree 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    .empty
log('empty tree hash', GitFile.hashToString(Tree.emptyHash, 0));
//=> empty tree hash 70bfe9793f3fc43d2a2306a58186fe0c88b86999

var offsets = {};
var file = Tree.createSkeleton(offsets, {});
log('empty skeleton file:\n' + GitFile.catFile(file));
//=> empty skeleton file:
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    .empty

var hashAt = function (i) {
    return GitFile.hashToString(file, i);
};

file = Tree.createSkeleton(offsets, {
    foo: 'blob',
});

file = Tree.addProperty(file, offsets, 'bar', 'tree');
file = Tree.addProperty(file, offsets, 'www', 'blob');
log(helper.prettyArray(file));
//=> tree 92\x0040000 bar\x00p\xbf\xe9y\x3f\x3f\xc4\x3d\x2a\x23\x06\xa5\x81\x86\xfe\x0c\x88\xb8i\x99100644 foo\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91100644 www\x00\xe6\x9d\xe2\x9b\xb2\xd1\xd6CK\x8b\x29\xaewZ\xd8\xc2\xe4\x8cS\x91
log(GitFile.catFile(file));
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
var helloWorldBlob = Blob.fromString('Hello, World!');
Sha1.hash(helloWorldBlob, helloHash, 0);
log(GitFile.hashToString(helloHash, 0));
//=> b45ef6fec89518d314f546fd6c3025367b721684
GitFile.setHash(file, offsets.foo, helloHash, 0);
log(GitFile.catFile(file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    fo
//=> 100644 blob b45ef6fec89518d314f546fd6c3025367b721684    foo
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    food

file = Tree.createSkeleton(offsets, {
    food: 'blob',
    bar: 'tree',
    bazzle: 'blob',
});
log(GitFile.catFile(file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    bar
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    bazzle
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    food

log('hashAt offsets.food', hashAt(offsets.food));
//=> hashAt offsets.food e69de29bb2d1d6434b8b29ae775ad8c2e48c5391