require('../helper');

var offsets = {};
var file = Tree.createSkeleton(offsets, {
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

var countBlob = Blob.fromString('' + object.count);
Sha1.hash(countBlob, object.file, offsets.count);
log(GitFile.catFile(object.file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    child
//=> 100644 blob c227083464fb9af8955c90d2924774ee50abb547    count
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    helper
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    text

var countBlobObject = Store.createBlobObject(object.count, countBlob, object.file, offsets.count);
Store.save(countBlobObject);

var got = Store.get(object.file, offsets.count);
log('got keys', Object.keys(got));
//=> got keys [ 'data', 'file', 'hash', 'hashOffset' ]
log(got.data);
//=> 0

Sha1.hash(object.file, object.hash, object.hashOffset);
got = Store.save(object);
log('saved keys', Object.keys(got));
//=> saved keys [ 'text', 'count', 'child', 'helper', 'file', 'hash', 'hashOffset' ]

got = Store.get(object.hash, object.hashOffset);
log('got keys', Object.keys(got));
//=> got keys [ 'text', 'count', 'child', 'helper', 'file', 'hash', 'hashOffset' ]

log(Store.prettyPrint());
//=> 1: #<0f621c text= count=0 child=null helper=null>
//=> 4: #<c22708 0>
//=> 5: #<70bfe9 null>
//=> 6: #<e69de2 >
//=>
