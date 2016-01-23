require('../test-helper');

var prettyPrint = function (array) {
    var pretty = [];
    var i;
    for (i = 0; i < array.length; i++) {
        if (array[i] === 0x20 || (48 <= array[i] && array[i] <= 57) || (65 <= array[i] && array[i] <= 90) || (97 <= array[i] && array[i] <= 122)) {
            pretty.push(String.fromCharCode(array[i]));
        } else {
            pretty.push('\\x' + ('00' + array[i].toString(16)).slice(-2));
        }
    }
    return pretty.join('');
};

var actuallyEmptyHash = new Uint8Array(20);
Sha1.hash(Tree._actuallyEmptyTree, actuallyEmptyHash, 0);
console.log('actually empty tree hash: ' + GitFile.hashToString(actuallyEmptyHash, 0));

console.log('empty tree', GitFile.catFile(Tree.empty));
console.log('empty tree hash', GitFile.hashToString(Tree.emptyHash, 0));

var offsets = {};
var file = Tree.createSkeleton(offsets, {});
console.log('empty skeleton file:\n' + GitFile.catFile(file));

var hashAt = function (i) {
    return GitFile.hashToString(file, i);
};

file = Tree.createSkeleton(offsets, {
    foo: 'blob',
});

file = Tree.addProperty(file, offsets, 'bar', 'tree');
file = Tree.addProperty(file, offsets, 'www', 'blob');
console.log('barfoowww file:')
console.log(prettyPrint(file));
console.log(GitFile.catFile(file));
console.log(offsets.bar, offsets.foo, offsets.www);
console.log(hashAt(offsets.bar), hashAt(offsets.foo), hashAt(offsets.www));

file = Tree.createSkeleton(offsets, {
    foo: 'blob',
});
file = Tree.addProperty(file, offsets, 'food', 'blob');
file = Tree.addProperty(file, offsets, 'fo', 'tree');
console.log('fofoofood file:');

var helloHash = new Uint8Array(20);
var helloWorldBlob = Blob.fromString('Hello, World!');
Sha1.hash(helloWorldBlob, helloHash, 0);

GitFile.setHash(file, offsets.foo, helloHash, 0);
console.log(GitFile.catFile(file));

file = Tree.createSkeleton(offsets, {
    food: 'blob',
    bar: 'tree',
    bazzle: 'blob',
});
console.log(GitFile.catFile(file));
console.log('hashAt offsets.food', hashAt(offsets.food));
