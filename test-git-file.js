var GitFile = require('./git-file');
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
var emptyBlob = GitFile.blobFromString('');
console.log('empty blob is "' + GitFile.catFile(emptyBlob) + '"');

Sha1.hash(emptyBlob, emptyHash, 0);
console.log('empty blob hash is ' + GitFile.hexArrayToString(emptyHash));

var helloHash = new Uint8Array(20);
var helloWorldBlob = GitFile.blobFromString('Hello, World!');
console.log(GitFile.catFile(helloWorldBlob));
Sha1.hash(helloWorldBlob, helloHash, 0);

var actuallyEmptyHash = new Uint8Array(20);
Sha1.hash(GitFile._actuallyEmptyTree, actuallyEmptyHash, 0);
console.log('actually empty tree hash: ' + GitFile.hexArrayToString(actuallyEmptyHash));

console.log('hashes are equal? ' + GitFile.hashEqual(emptyHash, 0, helloHash, 0));

console.log(GitFile.catFile(GitFile.emptyTree));
console.log(GitFile.hexArrayToString(GitFile.emptyTreeHash));

console.log('###############################################');

var indexInfo = {};
var file = GitFile.createSkeleton(indexInfo, {});
console.log('empty skeleton file:\n' + GitFile.catFile(file));

var hashAt = function (i) {
    return GitFile.hexArrayToString(file.slice(i, i + 20));
};

file = GitFile.createSkeleton(indexInfo, {
    foo: 'blob',
});

file = GitFile.addProperty(file, indexInfo, 'bar', 'tree');
file = GitFile.addProperty(file, indexInfo, 'www', 'blob');
console.log('barfoowww file:')
console.log(prettyPrint(file));
console.log(GitFile.catFile(file));
console.log(indexInfo.bar, indexInfo.foo, indexInfo.www);
console.log(hashAt(indexInfo.bar), hashAt(indexInfo.foo), hashAt(indexInfo.www));

file = GitFile.createSkeleton(indexInfo, {
    foo: 'blob',
});
file = GitFile.addProperty(file, indexInfo, 'food', 'blob');
file = GitFile.addProperty(file, indexInfo, 'fo', 'tree');
console.log('fofoofood file:');
GitFile.setHash(file, indexInfo.foo, helloHash, 0);
console.log(GitFile.catFile(file));

file = GitFile.createSkeleton(indexInfo, {
    foo: 'blob',
    bar: 'tree',
    baz: 'blob',
});
console.log(GitFile.catFile(file));
