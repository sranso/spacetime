'use strict';
require('../../../test/helper');

var random = Random.create(5000162);
global.$hashTable = HashTable.create(16, random);
global.$fileCache = FileCache.create(8, 128);

var foo = hash('foo');
log(foo, hexHash($hashTable.hashes8, foo));
//=> 260 'd45772e3c55b695235fa266f7668bb8adfb65d82'
log($hashTable.data8[HashTable.typeOffset(foo)], Type.string);
//=> 4 4
log($hashTable.data8[foo + HashTable.data8_stringLength]);
//=> 3
log($hashTable.data8[foo + 0], 'f'.charCodeAt(0));
//=> 102 102
log($hashTable.data8[foo + 1], 'o'.charCodeAt(0));
//=> 111 111
log($hashTable.data8[foo + 2], 'o'.charCodeAt(0));
//=> 111 111

var msg = hash('a short message wins');
log(msg, hexHash($hashTable.hashes8, msg));
//=> 132 'a86df2fed7643f7139ab69428e129a48e3924bcc'
log($hashTable.data8[HashTable.typeOffset(msg)], Type.string20);
//=> 5 5
log($hashTable.data8[msg + 0], 'a'.charCodeAt(0));
//=> 97 97
log($hashTable.data8[msg + 1], ' '.charCodeAt(0));
//=> 32 32
log($hashTable.data8[msg + 18], 'n'.charCodeAt(0));
//=> 110 110
log($hashTable.data8[msg + 19], 's'.charCodeAt(0));
//=> 115 115

var num1 = hash(42);
log(num1, hexHash($hashTable.hashes8, num1));
//=> 4 'f70d7bba4ae1f07682e0358bd7a2068094fc023b'
log($hashTable.data8[HashTable.typeOffset(num1)], Type.integer);
//=> 6 6
log($hashTable.dataInt32[(num1 >> 2) + 0]);
//=> 42

var num2 = hash(375.20351695201254);
log(num2, hexHash($hashTable.hashes8, num2));
//=> 324 'fd0b75561cc20060e72bbba563c7908c898ff6d9'
log($hashTable.data8[HashTable.typeOffset(num2)], Type.float);
//=> 7 7
log($hashTable.dataFloat64[(num2 + 4) >> 3]);
//=> 375.20351695201254
