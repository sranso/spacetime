require('../test-helper');

var emptyHash = new Uint8Array(20);
var emptyBlob = Blob.fromString('');
console.log('empty blob is "' + GitFile.catFile(emptyBlob) + '"');

Sha1.hash(emptyBlob, emptyHash, 0);
console.log('empty blob hash is ' + GitFile.hashToString(emptyHash, 0));

var helloHash = new Uint8Array(20);
var helloWorldBlob = Blob.fromString('Hello, World!');
console.log(GitFile.catFile(helloWorldBlob));
Sha1.hash(helloWorldBlob, helloHash, 0);
console.log('hello world blob is "' + GitFile.catFile(helloWorldBlob) + '"');
console.log('hello world blob hash is ' + GitFile.hashToString(helloHash, 0));

console.log('hashes are equal? ' + GitFile.hashEqual(emptyHash, 0, helloHash, 0));
