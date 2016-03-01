'use strict';
require('../helper');

global.$Heap = Heap.create(1024);
global.$ = $Heap.array;
var random = Random.create(526926);
global.$HashTable = HashTable.create(8, $Heap, random);
global.$PackData = PackData.create(512);

PackIndex.initialize();

var fooRange = Blob.createFromString('foo');
var fooStart = fooRange[0];
var fooEnd = fooRange[1];
var fooHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, fooStart, fooEnd, $, fooHashOffset);
log(hash($, fooHashOffset));
//=> 19102815663d23f8b75a47e7a01965dcdc96468c

var barRange = Blob.createFromString('bar');
var barStart = barRange[0];
var barEnd = barRange[1];
var barHashOffset = $Heap.nextOffset;
$Heap.nextOffset += 20;
Sha1.hash($, barStart, barEnd, $, barHashOffset);
log(hash($, barHashOffset));
//=> ba0e162e1c47469e3fe4b393a8bf8c569f302116

var inputPackData = PackData.create(216);
inputPackData.array[11] = 2;  // Number of packed files.
inputPackData.nextOffset = 12;
PackData.packFile(inputPackData, fooStart, fooEnd);
PackData.packFile(inputPackData, barStart, barEnd);

var inputPackHashOffset = inputPackData.nextOffset;
var inputPack = inputPackData.array;
Sha1.hash(inputPack, 0, inputPackHashOffset, inputPack, inputPackHashOffset);
log(hash(inputPack, inputPackHashOffset));
//=> c3bb7a426b16abdcf764597de428cc40d25bb9f8








var index = PackIndex.create($HashTable.n);
log(index.offsets.length);
//=> 8

PackIndex.indexPack(index, inputPack);

var hashOffset = HashTable.findHashOffset($HashTable, fooHashOffset);
log(hashOffset, hash($, hashOffset));
//=> 4 '19102815663d23f8b75a47e7a01965dcdc96468c'
var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
log(objectIndex, index.offsets[objectIndex]);
//=> 0 0

hashOffset = HashTable.findHashOffset($HashTable, barHashOffset);
log(hashOffset, hash($, hashOffset));
//=> 132 'ba0e162e1c47469e3fe4b393a8bf8c569f302116'
objectIndex = HashTable.objectIndex($HashTable, hashOffset);
log(objectIndex, index.offsets[objectIndex]);
//=> 6 12

var file = PackIndex.lookupFile(index, hashOffset);
var fileStart = file[0];
var fileEnd = file[1];
log(pretty($, fileStart, fileEnd));
//=> blob 3\x00bar
