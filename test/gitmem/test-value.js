'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
global.$ = $Heap.array;
var random = Random.create(526926);
global.$HashTable = HashTable.create(8, $Heap, random);
global.$PackIndex = PackIndex.create(8);
global.$PackData = PackData.create(512);

PackIndex.initialize();

var stringRange = Value.blobFromString('foo');
var stringStart = stringRange[0];
var stringEnd = stringRange[1];
log(pretty($, stringStart, stringEnd));
//=> blob 4\x00"foo
var string = Value.parseString(stringStart, stringEnd);
log(string, typeof string);
//=> foo string

var numberRange = Value.blobFromNumber(375.2);
var numberStart = numberRange[0];
var numberEnd = numberRange[1];
log(pretty($, numberStart, numberEnd));
//=> blob 5\x00375.2
var number = Value.parseNumber(numberStart, numberEnd);
log(number, typeof number);
//=> 375.2 'number'

var trueRange = Value.blobFromBoolean(true);
var trueStart = trueRange[0];
var trueEnd = trueRange[1];
log(pretty($, trueStart, trueEnd));
//=> blob 4\x00true
var bool = Value.parseBoolean(trueStart, trueEnd);
log(bool, typeof bool);
//=> true 'boolean'

var falseRange = Value.blobFromBoolean(false);
var falseStart = falseRange[0];
var falseEnd = falseRange[1];
log(pretty($, falseStart, falseEnd));
//=> blob 5\x00false
bool = Value.parseBoolean(falseStart, falseEnd);
log(bool, typeof bool);
//=> false 'boolean'

var tree = Tree.create({
    string: 'blob',
    number: 'blob',
    bool: 'blob',
});
var treeStart = tree[0];
var treeEnd = tree[1];
var offsets = tree[2];

var stringHashOffset = treeStart + offsets.string;
var numberHashOffset = treeStart + offsets.number;
var trueHashOffset = treeStart + offsets.bool;
Sha1.hash($, stringStart, stringEnd, $, stringHashOffset);
Sha1.hash($, numberStart, numberEnd, $, numberHashOffset);
Sha1.hash($, trueStart, trueEnd, $, trueHashOffset);

var treeHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, treeStart, treeEnd, $, treeHashOffset);
log(hash($, treeHashOffset));
//=> 0051e89e36359217a9cb5e27fcaf8f40b36407f5

var hashOffset = ~HashTable.findHashOffset($HashTable, stringHashOffset);
HashTable.setHash($HashTable, hashOffset, stringHashOffset);
var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, stringStart, stringEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, numberHashOffset);
HashTable.setHash($HashTable, hashOffset, numberHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, numberStart, numberEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, trueHashOffset);
HashTable.setHash($HashTable, hashOffset, trueHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, trueStart, trueEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, treeHashOffset);
HashTable.setHash($HashTable, hashOffset, treeHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, treeStart, treeEnd);

var gotString = Value.checkoutString(stringHashOffset);
log(gotString);
//=> foo

// Make sure it works a second time, as we store object in
// table the first time we checkout.
var gotStringAgain = Value.checkoutString(stringHashOffset);
log(gotStringAgain);
//=> foo
hashOffset = HashTable.findHashOffset($HashTable, stringHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var savedString = $HashTable.objects[objectIndex].data;
log(savedString);
//=> foo

var gotNumber = Value.checkoutNumber(numberHashOffset);
log(gotNumber, typeof gotNumber);
//=> 375.2 'number'
var gotNumberAgain = Value.checkoutNumber(numberHashOffset);
log(gotNumberAgain, typeof gotNumberAgain);
//=> 375.2 'number'
hashOffset = HashTable.findHashOffset($HashTable, numberHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var savedNumber = $HashTable.objects[objectIndex].data;
log(savedNumber, typeof savedNumber);
//=> 375.2 'number'

var gotBool = Value.checkoutBoolean(trueHashOffset);
log(gotBool, typeof gotBool);
//=> true 'boolean'
var gotBoolAgain = Value.checkoutBoolean(trueHashOffset);
log(gotBoolAgain, typeof gotBoolAgain);
//=> true 'boolean'
hashOffset = HashTable.findHashOffset($HashTable, trueHashOffset);
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
var savedBool = $HashTable.objects[objectIndex].data;
log(savedBool, typeof savedBool);
//=> true 'boolean'
