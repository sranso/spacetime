var GitObject = require('./git-object');
var Sha1 = require('./sha1');

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

var emptyHash = new Uint8Array(20);
var emptyBlob = GitObject.blobFromString('');
console.log('empty blob is "' + GitObject.catFile(emptyBlob) + '"');

Sha1.hash(emptyBlob, emptyHash, 0);
console.log('empty blob hash is ' + GitObject.hexArrayToString(emptyHash));

var helloHash = new Uint8Array(20);
var helloWorldBlob = GitObject.blobFromString('Hello, World!');
console.log(GitObject.catFile(helloWorldBlob));
Sha1.hash(helloWorldBlob, helloHash, 0);

var actuallyEmptyHash = new Uint8Array(20);
Sha1.hash(GitObject._actuallyEmptyTree, actuallyEmptyHash, 0);
console.log('actually empty tree hash: ' + GitObject.hexArrayToString(actuallyEmptyHash));

console.log('hashes are equal? ' + GitObject.hashEqual(emptyHash, 0, helloHash, 0));

console.log(GitObject.catFile(GitObject.emptyTree));
console.log(GitObject.hexArrayToString(GitObject.emptyTreeHash));

console.log('###############################################');

var indexInfo = {};
var file = GitObject.createSkeleton(indexInfo, {});
console.log('empty skeleton file:\n' + GitObject.catFile(file));

var hashAt = function (i) {
    return GitObject.hexArrayToString(file.slice(i, i + 20));
};

file = GitObject.createSkeleton(indexInfo, {
    foo: 'blob',
});

file = GitObject.addProperty(file, indexInfo, 'bar', 'tree');
file = GitObject.addProperty(file, indexInfo, 'www', 'blob');
console.log('barfoowww file:')
console.log(prettyPrint(file));
console.log(GitObject.catFile(file));
console.log(indexInfo.bar, indexInfo.foo, indexInfo.www);
console.log(hashAt(indexInfo.bar), hashAt(indexInfo.foo), hashAt(indexInfo.www));

file = GitObject.createSkeleton(indexInfo, {
    foo: 'blob',
});
file = GitObject.addProperty(file, indexInfo, 'food', 'blob');
file = GitObject.addProperty(file, indexInfo, 'fo', 'tree');
console.log('fofoofood file:');
GitObject.setHash(file, indexInfo.foo, helloHash, 0);
console.log(GitObject.catFile(file));

file = GitObject.createSkeleton(indexInfo, {
    foo: 'blob',
    bar: 'tree',
    baz: 'blob',
});
console.log(GitObject.catFile(file));
