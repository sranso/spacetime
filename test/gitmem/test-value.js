'use strict';
require('../helper');

global.$heap = Heap.create(1024);
var $h = $heap.array;
var random = Random.create(526926);
global.$hashTable = HashTable.create(8, random);
global.$fileCache = FileCache.create(3, 128);
global.$packData = PackData.create(512);

PackIndex.initialize();

var valueObject = Value.createObject('foo bar');
log(valueObject.value);
//=> foo bar

var stringRange = Value.createBlob('foo', 'string', []);
var stringStart = stringRange[0];
var stringEnd = stringRange[1];
log(pretty($fileCache.array, stringStart, stringEnd));
//=> blob 4\x00"foo

var numberRange = Value.createBlob(375.2, 'number', []);
var numberStart = numberRange[0];
var numberEnd = numberRange[1];
log(pretty($fileCache.array, numberStart, numberEnd));
//=> blob 5\x00375.2

var trueRange = Value.createBlob(true, 'boolean', []);
var trueStart = trueRange[0];
var trueEnd = trueRange[1];
log(pretty($fileCache.array, trueStart, trueEnd));
//=> blob 4\x00true

var falseRange = Value.createBlob(false, 'boolean', []);
var falseStart = falseRange[0];
var falseEnd = falseRange[1];
log(pretty($fileCache.array, falseStart, falseEnd));
//=> blob 5\x00false

var stringHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
var numberHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
var trueHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
var falseHashOffset = $heap.nextOffset;
$heap.nextOffset += 20;
Sha1.hash($fileCache.array, stringStart, stringEnd, $h, stringHashOffset);
Sha1.hash($fileCache.array, numberStart, numberEnd, $h, numberHashOffset);
Sha1.hash($fileCache.array, trueStart, trueEnd, $h, trueHashOffset);
Sha1.hash($fileCache.array, falseStart, falseEnd, $h, falseHashOffset);

var hashOffset = ~HashTable.findHashOffset($hashTable, $h, stringHashOffset);
HashTable.setHash($hashTable, hashOffset, $h, stringHashOffset);
$hashTable.data32[(hashOffset >> 2) + HashTable.data32_packOffset] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, stringStart, stringEnd);

hashOffset = ~HashTable.findHashOffset($hashTable, $h, numberHashOffset);
HashTable.setHash($hashTable, hashOffset, $h, numberHashOffset);
$hashTable.data32[(hashOffset >> 2) + HashTable.data32_packOffset] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, numberStart, numberEnd);

hashOffset = ~HashTable.findHashOffset($hashTable, $h, trueHashOffset);
HashTable.setHash($hashTable, hashOffset, $h, trueHashOffset);
$hashTable.data32[(hashOffset >> 2) + HashTable.data32_packOffset] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, trueStart, trueEnd);

hashOffset = ~HashTable.findHashOffset($hashTable, $h, falseHashOffset);
HashTable.setHash($hashTable, hashOffset, $h, falseHashOffset);
$hashTable.data32[(hashOffset >> 2) + HashTable.data32_packOffset] = $packData.nextOffset;
PackData.packFile($packData, $fileCache.array, falseStart, falseEnd);

var gotString = Value.checkout($h, stringHashOffset, 'string');
log(gotString, typeof gotString);
//=> foo string
// Make sure it works a second time, as we store object in
// table the first time we checkout.
var gotStringAgain = Value.checkout($h, stringHashOffset, 'string');
log(gotStringAgain, typeof gotStringAgain);
//=> foo string
hashOffset = HashTable.findHashOffset($hashTable, $h, stringHashOffset);
var objectIndex = HashTable.objectIndex(hashOffset);
var savedString = $hashTable.objects[objectIndex].value;
log(savedString, typeof savedString);
//=> foo string

var gotNumber = Value.checkout($h, numberHashOffset, 'number');
log(gotNumber, typeof gotNumber);
//=> 375.2 'number'
hashOffset = HashTable.findHashOffset($hashTable, $h, numberHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
var savedNumber = $hashTable.objects[objectIndex].value;
log(savedNumber, typeof savedNumber);
//=> 375.2 'number'

var gotTrue = Value.checkout($h, trueHashOffset, 'boolean');
log(gotTrue, typeof gotTrue);
//=> true 'boolean'
hashOffset = HashTable.findHashOffset($hashTable, $h, trueHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
var savedTrue = $hashTable.objects[objectIndex].value;
log(savedTrue, typeof savedTrue);
//=> true 'boolean'

var gotFalse = Value.checkout($h, falseHashOffset, 'boolean');
log(gotFalse, typeof gotFalse);
//=> false 'boolean'
hashOffset = HashTable.findHashOffset($hashTable, $h, falseHashOffset);
objectIndex = HashTable.objectIndex(hashOffset);
var savedFalse = $hashTable.objects[objectIndex].value;
log(savedFalse, typeof savedFalse);
//=> false 'boolean'
