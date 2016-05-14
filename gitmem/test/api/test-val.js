'use strict';
require('../../../test/helper');

global.$table = Table.create(16, Random.create(926081));
global.$file = new Uint8Array(32);

var messageString = 'I <3 short messages';
var messageBlobLength = Blob.create('"' + messageString);
var messageHash = new Uint8Array(20);
Sha1.hash($file, 0, messageBlobLength, messageHash, 0);

var message = ~Table.findPointer($table, messageHash, 0);
Table.setHash($table, message, messageHash, 0);
Convert.stringToExistingArray($table.data8, message, messageString);
$table.data8[Table.typeOffset(message)] = Type.string;
$table.data8[message + Table.data8_stringLength] = messageString.length;
log(val(message));
//=> I <3 short messages
log(val(message).length, messageString.length);
//=> 19 19

var answerValue = 42;
var answerBlobLength = Blob.create('' + answerValue);
var answerHash = new Uint8Array(20);
Sha1.hash($file, 0, answerBlobLength, answerHash, 0);

var answer = ~Table.findPointer($table, answerHash, 0);
Table.setHash($table, answer, answerHash, 0);
Convert.stringToExistingArray($table.data8, answer, '' + answerValue);
$table.data8[Table.typeOffset(answer)] = Type.integer;
$table.dataInt32[answer >> 2] = answerValue;
log(val(answer), val(answer) === answerValue);
//=> 42 true

var piValue = 3.141592653589793;
var piBlobLength = Blob.create('' + piValue);
var piHash = new Uint8Array(20);
Sha1.hash($file, 0, piBlobLength, piHash, 0);

var pi = ~Table.findPointer($table, piHash, 0);
Table.setHash($table, pi, piHash, 0);
Convert.stringToExistingArray($table.data8, pi, '' + piValue);
$table.data8[Table.typeOffset(pi)] = Type.float;
$table.dataFloat64[(pi + 4) >> 3] = piValue;
log(val(pi), val(pi) === piValue);
//=> 375.20351695201254 true
