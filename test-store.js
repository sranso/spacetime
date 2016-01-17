var Store = require('./store');
var GitFile = require('./git-file');
var Sha1 = require('./sha1');

var offsets = {};
var file = GitFile.createSkeleton(offsets, {
    text: 'blob',
    count: 'blob',
    child: 'tree',
    helper: 'tree',
});

var object = {
    text: '',
    count: 0,
    child: null,
    helper: null,
    file: file,
    hash: new Uint8Array(20),
    hashOffset: 0,
};

var countBlob = GitFile.blobFromString('' + object.count);
Sha1.hash(countBlob, object.file, offsets.count);
console.log(GitFile.catFile(object.file));
var countBlobObject = Store.createBlobObject(object.count, countBlob, object.file, offsets.count);
Store.save(countBlobObject);

var got = Store.get(object.file, offsets.count);
console.log('got keys', Object.keys(got));
console.log(got.data);

Sha1.hash(object.file, object.hash, object.hashOffset);
got = Store.save(object);
console.log('saved keys', Object.keys(got));

got = Store.get(object.hash, object.hashOffset);
console.log('got keys', Object.keys(got));

console.log('\npretty print:');
console.log(Store.prettyPrint());
