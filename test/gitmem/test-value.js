'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
var $h = $Heap.array;
var random = Random.create(526926);
global.$HashTable = HashTable.create(8, random);
global.$Objects = Objects.create(8);
global.$PackIndex = PackIndex.create(8);
global.$FileCache = FileCache.create(3, 100);
global.$PackData = PackData.create(512);

PackIndex.initialize();

var valueObject = Value.createObject('foo bar');
log(valueObject.value);
//=> foo bar

var stringRange = Value.createBlob('foo', 'string', []);
var stringStart = stringRange[0];
var stringEnd = stringRange[1];
log(pretty($h, stringStart, stringEnd));
//=> blob 4\x00"foo

var numberRange = Value.createBlob(375.2, 'number', []);
var numberStart = numberRange[0];
var numberEnd = numberRange[1];
log(pretty($h, numberStart, numberEnd));
//=> blob 5\x00375.2

var trueRange = Value.createBlob(true, 'boolean', []);
var trueStart = trueRange[0];
var trueEnd = trueRange[1];
log(pretty($h, trueStart, trueEnd));
//=> blob 4\x00true

var falseRange = Value.createBlob(false, 'boolean', []);
var falseStart = falseRange[0];
var falseEnd = falseRange[1];
log(pretty($h, falseStart, falseEnd));
//=> blob 5\x00false

var stringHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
var numberHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
var trueHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
var falseHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($h, stringStart, stringEnd, $h, stringHashOffset);
Sha1.hash($h, numberStart, numberEnd, $h, numberHashOffset);
Sha1.hash($h, trueStart, trueEnd, $h, trueHashOffset);
Sha1.hash($h, falseStart, falseEnd, $h, falseHashOffset);

var hashOffset = ~HashTable.findHashOffset($HashTable, $h, stringHashOffset);
HashTable.setHash($HashTable, hashOffset, $h, stringHashOffset);
var objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, $h, stringStart, stringEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, $h, numberHashOffset);
HashTable.setHash($HashTable, hashOffset, $h, numberHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, $h, numberStart, numberEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, $h, trueHashOffset);
HashTable.setHash($HashTable, hashOffset, $h, trueHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, $h, trueStart, trueEnd);

hashOffset = ~HashTable.findHashOffset($HashTable, $h, falseHashOffset);
HashTable.setHash($HashTable, hashOffset, $h, falseHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
$PackIndex.offsets[objectIndex] = $PackData.nextOffset;
PackData.packFile($PackData, $h, falseStart, falseEnd);

var gotString = Value.checkout($h, stringHashOffset, 'string');
log(gotString, typeof gotString);
//=> foo string
// Make sure it works a second time, as we store object in
// table the first time we checkout.
var gotStringAgain = Value.checkout($h, stringHashOffset, 'string');
log(gotStringAgain, typeof gotStringAgain);
//=> foo string
hashOffset = HashTable.findHashOffset($HashTable, $h, stringHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
var savedString = $Objects.table[objectIndex].value;
log(savedString, typeof savedString);
//=> foo string

var gotNumber = Value.checkout($h, numberHashOffset, 'number');
log(gotNumber, typeof gotNumber);
//=> 375.2 'number'
hashOffset = HashTable.findHashOffset($HashTable, $h, numberHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
var savedNumber = $Objects.table[objectIndex].value;
log(savedNumber, typeof savedNumber);
//=> 375.2 'number'

var gotTrue = Value.checkout($h, trueHashOffset, 'boolean');
log(gotTrue, typeof gotTrue);
//=> true 'boolean'
hashOffset = HashTable.findHashOffset($HashTable, $h, trueHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
var savedTrue = $Objects.table[objectIndex].value;
log(savedTrue, typeof savedTrue);
//=> true 'boolean'

var gotFalse = Value.checkout($h, falseHashOffset, 'boolean');
log(gotFalse, typeof gotFalse);
//=> false 'boolean'
hashOffset = HashTable.findHashOffset($HashTable, $h, falseHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
var savedFalse = $Objects.table[objectIndex].value;
log(savedFalse, typeof savedFalse);
//=> false 'boolean'
