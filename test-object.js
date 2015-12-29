var GitObject = require('./git-object');
var Sha1 = require('./sha1');

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

console.log(GitObject.catFile(GitObject.emptyTree.file));
console.log(GitObject.hexArrayToString(GitObject.emptyTree.hash));

console.log('###############################################');

var obj = GitObject.createSkeleton({});
console.log('empty skeleton file:\n' + GitObject.catFile(obj.file));

obj = GitObject.createSkeleton({
    foo: 'blob',
});

GitObject.addProperty(obj, 'bar', 'tree');
GitObject.addProperty(obj, 'www', 'blob');
console.log('barfoowww file:\n' + GitObject.catFile(obj.file));

obj = GitObject.createSkeleton({
    foo: 'blob',
});
GitObject.addProperty(obj, 'food', 'blob');
GitObject.addProperty(obj, 'fo', 'tree');
console.log('fofoofood file:\n' + GitObject.catFile(obj.file));

GitObject.setHash(obj, obj.textIndex, helloHash, 0);
