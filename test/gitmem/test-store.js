'use strict';
require('../helper');

var random = Random.create(42);
var store = Store.create(random);

var offsets = {};
var file = Tree.createSkeleton(offsets, {
    text: 'blob',
    count: 'blob',
    child: 'tree',
    thing: 'tree',
});

var object = {
    text: '',
    count: 0,
    child: null,
    thing: null,
    file: file,
    hash: new Uint8Array(20),
    hashOffset: 0,
};

var countBlob = Blob.createFromString('' + object.count);
Sha1.hash(countBlob, object.file, offsets.count);
log(Tree.catFile(object.file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    child
//=> 100644 blob c227083464fb9af8955c90d2924774ee50abb547    count
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    text
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    thing

var countBlobObject = Value.createBlobObject(object.count, countBlob, object.file, offsets.count);
Store.save(store, countBlobObject);

var got = Store.get(store, object.file, offsets.count);
log('got keys', Object.keys(got));
//=> got keys [ 'data', 'file', 'hash', 'hashOffset' ]
log(got.data);
//=> 0

Sha1.hash(object.file, object.hash, object.hashOffset);
got = Store.save(store, object);
log('saved keys', Object.keys(got));
//=> saved keys [ 'text', 'count', 'child', 'thing', 'file', 'hash', 'hashOffset' ]

got = Store.get(store, object.hash, object.hashOffset);
log('got keys', Object.keys(got));
//=> got keys [ 'text', 'count', 'child', 'thing', 'file', 'hash', 'hashOffset' ]

log(Store.prettyPrint(store));
//=> 0: #<c189b9 text= count=0 child=null thing=null>
//=> 2: #<c22708 0>
