'use strict';
require('../../../test/helper');

var random = Random.create(5000162);
global.$hashTable = HashTable.create(16, random);
global.$fileCache = FileCache.create(8, 128);

var foo = hash('I <3 short messages');
log(foo, hexHash($hashTable.hashes8, foo));
//=> 4 '4bcaa335392f4f0fb35fda58017d41fa07ddeb8b'
log($hashTable.data8[HashTable.typeOffset(foo)], Type.string);
//=> 4 4
log($hashTable.data8[foo + HashTable.data8_stringLength]);
//=> 19
var stringOffset = foo + HashTable.data8_stringStart;
log($hashTable.data8[stringOffset + 0], 'I'.charCodeAt(0));
//=> 73 73
log($hashTable.data8[stringOffset + 1], ' '.charCodeAt(0));
//=> 32 32
log($hashTable.data8[stringOffset + 18], 's'.charCodeAt(0));
//=> 115 115

var num1 = hash(42);
log(num1, hexHash($hashTable.hashes8, num1));
//=> 24 'f70d7bba4ae1f07682e0358bd7a2068094fc023b'
log($hashTable.data8[HashTable.typeOffset(num1)], Type.integer);
//=> 5 5
log($hashTable.dataInt32[(num1 >> 2) + 0]);
//=> 42

var num2 = hash(375.20351695201254);
log(num2, hexHash($hashTable.hashes8, num2));
//=> 324 'fd0b75561cc20060e72bbba563c7908c898ff6d9'
log($hashTable.data8[HashTable.typeOffset(num2)], Type.float);
//=> 6 6
log($hashTable.dataFloat64[(num2 + 4) >> 3]);
//=> 375.20351695201254
