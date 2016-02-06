var helper = require('../helper');
var hex = helper.hex;

var blob = Blob.createFromString('foo');
log(helper.pretty(blob));
//=> blob 3\x00foo

var emptyHash = new Uint8Array(20);
var emptyBlob = Blob.createFromString('');
log('empty blob is "' + GitFile.catFile(emptyBlob) + '"');
//=> empty blob is ""

Sha1.hash(emptyBlob, emptyHash, 0);
log('empty blob hash is ' + hex(Blob.emptyHash));
//=> empty blob hash is e69de29bb2d1d6434b8b29ae775ad8c2e48c5391

log(GitFile.hashEqual(emptyHash, 0, Blob.emptyHash, 0));
//=> true

var helloHash = new Uint8Array(20);
var helloWorldBlob = Blob.createFromString('Hello, World!');
log(GitFile.catFile(helloWorldBlob));
//=> Hello, World!
Sha1.hash(helloWorldBlob, helloHash, 0);
log('hello world blob is "' + GitFile.catFile(helloWorldBlob) + '"');
//=> hello world blob is "Hello, World!"
log('hello world blob hash is ' + hex(helloHash));
//=> hello world blob hash is b45ef6fec89518d314f546fd6c3025367b721684

log('hashes are equal? ' + GitFile.hashEqual(emptyHash, 0, helloHash, 0));
//=> hashes are equal? false
