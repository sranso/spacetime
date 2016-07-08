'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$table = Table.create(8, Random.create(5000162));

var message = hash('I <3 short messages');
log(message, hexHash($table.hashes8, message));
//=> 4 '4bcaa335392f4f0fb35fda58017d41fa07ddeb8b'
log($table.data8[Table.typeOffset(message)], Type.string);
//=> 4 4
log($table.data8[message + Table.data8_stringLength]);
//=> 19
log($table.data8[message + 0], 'I'.charCodeAt(0));
//=> 73 73
log($table.data8[message + 1], ' '.charCodeAt(0));
//=> 32 32
log($table.data8[message + 18], 's'.charCodeAt(0));
//=> 115 115

var message20 = hash('I am a string20 msg!');
log(message20, hexHash($table.hashes8, message20));
//=> 24 '41b606864613f7dabff68d2fc548c208d457ca6d'
log($table.data8[Table.typeOffset(message20)], Type.string20);
//=> 5 5
log($table.data8[message20 + 0], 'I'.charCodeAt(0));
//=> 73 73
log($table.data8[message20 + 1], ' '.charCodeAt(0));
//=> 32 32
log($table.data8[message20 + 19], '!'.charCodeAt(0));
//=> 33 33

var longMessage = hash('I am a longer message');
log(longMessage, hexHash($table.hashes8, longMessage));
//=> 44 'c6de9479651cdd8de13f3ae1f521a9ad68a4c484'
log($table.data8[Table.typeOffset(longMessage)], Type.longString);
//=> 6 6
log($table.data8[longMessage + Table.data8_stringLength]);
//=> 21
var longStringI = $table.data32[(longMessage >> 2) + 0];
log(longStringI);
//=> 0
log($table.dataLongStrings[longStringI]);
//=> I am a longer message

var answer = hash(42);
log(answer, hexHash($table.hashes8, answer));
//=> 132 'f70d7bba4ae1f07682e0358bd7a2068094fc023b'
log($table.data8[Table.typeOffset(answer)], Type.integer);
//=> 7 7
log($table.dataInt32[(answer >> 2) + 0]);
//=> 42

var pi = hash(3.141592653589793);
log(pi, hexHash($table.hashes8, pi));
//=> 68 'e5c1cebcacfc81cf51a61c031e716d874981360e'
log($table.data8[Table.typeOffset(pi)], Type.float);
//=> 8 8
log($table.dataFloat64[(pi + 4) >> 3]);
//=> 3.141592653589793
