var helper = require('../helper');
var hex = helper.hex;

var oldGetTimezoneOffset = Date.prototype.getTimezoneOffset;
Date.prototype.getTimezoneOffset = function () {
    return 360;
};

var stringBlob = Value.blobFromString('foo');
log(helper.pretty(stringBlob));
//=> blob 4\x00\x22foo
var string = Value.parseString(stringBlob);
log(string, typeof string);
//=> foo string

var numberBlob = Value.blobFromNumber(375.2);
log(helper.pretty(numberBlob));
//=> blob 5\x00375.2
var number = Value.parseNumber(numberBlob);
log(number, typeof number);
//=> 375.2 'number'

var trueBlob = Value.blobFromBoolean(true);
log(helper.pretty(trueBlob));
//=> blob 4\x00true
var bool = Value.parseBoolean(trueBlob);
log(bool, typeof bool);
//=> true 'boolean'

var falseBlob = Value.blobFromBoolean(false);
log(helper.pretty(falseBlob));
//=> blob 5\x00false
bool = Value.parseBoolean(falseBlob);
log(bool, typeof bool);
//=> false 'boolean'

var offsets = {};
var tree = Tree.createSkeleton(offsets, {
    string: 'blob',
    number: 'blob',
    bool: 'blob',
});

Sha1.hash(stringBlob, tree, offsets.string);
Sha1.hash(numberBlob, tree, offsets.number);
Sha1.hash(trueBlob, tree, offsets.bool);

var treeHash = new Uint8Array(20);
Sha1.hash(tree, treeHash, 0);
log(hex(treeHash));
//=> 0051e89e36359217a9cb5e27fcaf8f40b36407f5

var author = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    date: new Date(2016, 2, 6, 20, 57, 39),
};

var commitObject = {
    tree: {hash: treeHash, hashOffset: 0},
    parents: [],
    committer: author,
    author: author,
    message: 'Initial commit\n',
};

var commit = CommitFile.createFromObject(commitObject);
var commitHash = new Uint8Array(20);
Sha1.hash(commit, commitHash, 0);
log(hex(commitHash));
//=> 22aec7a136ebc09a4ab8ab7de0779e1910553732

var pack = Pack.create([commit, tree, stringBlob, numberBlob, trueBlob]);
var index = PackIndex.create(pack);
var store = Store.create();

var gotString = Value.checkoutString([index], store, tree, offsets.string);
log(gotString);
//=> foo

var gotStringAgain = Value.checkoutString([index], store, tree, offsets.string);
log(gotStringAgain);
//=> foo

var savedString = Store.get(store, tree, offsets.string).data;
log(savedString);
//=> foo

var bar = Value.blobFromString('bar');
var barHash = new Uint8Array(20);
Sha1.hash(bar, barHash, 0);
Store.save(store, Value.createBlobObject('bar', bar, barHash, 0));

var gotBar = Value.checkoutString([index], store, barHash, 0);
log(gotBar);
//=> bar

var gotNumber = Value.checkoutNumber([index], store, tree, offsets.number);
log(gotNumber, typeof gotNumber);
//=> 375.2 'number'

var savedNumber = Store.get(store, tree, offsets.number).data;
log(savedNumber, typeof savedNumber);
//=> 375.2 'number'

var gotBool = Value.checkoutBoolean([index], store, tree, offsets.bool);
log(gotBool, typeof gotBool);
//=> true 'boolean'

var savedBool = Store.get(store, tree, offsets.bool).data;
log(savedBool, typeof savedBool);
//=> true 'boolean'

Date.prototype.getTimezoneOffset = oldGetTimezoneOffset;
