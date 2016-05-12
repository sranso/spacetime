'use strict';
require('../../../test/helper');

global.$table = Table.create(16, Random.create(5000162));
global.$file = new Uint8Array(32);

var foo = hash('I <3 short messages');
log(foo, hexHash($table.hashes8, foo));
//=> 4 '4bcaa335392f4f0fb35fda58017d41fa07ddeb8b'
log($table.data8[Table.typeOffset(foo)], Type.string);
//=> 4 4
log($table.data8[foo + Table.data8_stringLength]);
//=> 19
log($table.data8[foo + 0], 'I'.charCodeAt(0));
//=> 73 73
log($table.data8[foo + 1], ' '.charCodeAt(0));
//=> 32 32
log($table.data8[foo + 18], 's'.charCodeAt(0));
//=> 115 115

var num1 = hash(42);
log(num1, hexHash($table.hashes8, num1));
//=> 24 'f70d7bba4ae1f07682e0358bd7a2068094fc023b'
log($table.data8[Table.typeOffset(num1)], Type.integer);
//=> 5 5
log($table.dataInt32[(num1 >> 2) + 0]);
//=> 42

var num2 = hash(375.20351695201254);
log(num2, hexHash($table.hashes8, num2));
//=> 324 'fd0b75561cc20060e72bbba563c7908c898ff6d9'
log($table.data8[Table.typeOffset(num2)], Type.float);
//=> 6 6
log($table.dataFloat64[(num2 + 4) >> 3]);
//=> 375.20351695201254
