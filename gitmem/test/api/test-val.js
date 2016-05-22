'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(32);
global.$table = Table.create(16, Random.create(926081));

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

var longMessageString = 'I am a long message!';
var longMessageBlobLength = Blob.create('"' + longMessageString);
var longMessageHash = new Uint8Array(20);
Sha1.hash($file, 0, longMessageBlobLength, longMessageHash, 0);

var longMessage = ~Table.findPointer($table, longMessageHash, 0);
Table.setHash($table, longMessage, longMessageHash, 0);
Convert.stringToExistingArray($table.data8, longMessage, longMessageString);
$table.data8[Table.typeOffset(longMessage)] = Type.longString;
$table.data32[longMessage >> 2] = $table.dataLongStrings.length;
$table.dataLongStrings.push(longMessageString);
log(val(longMessage));
//=> I am a long message!
log(val(longMessage).length, longMessageString.length);
//=> 20 20

var answerValue = 42;
var answerBlobLength = Blob.create('' + answerValue);
var answerHash = new Uint8Array(20);
Sha1.hash($file, 0, answerBlobLength, answerHash, 0);

var answer = ~Table.findPointer($table, answerHash, 0);
Table.setHash($table, answer, answerHash, 0);
Convert.stringToExistingArray($table.data8, answer, '' + answerValue);
$table.data8[Table.typeOffset(answer)] = Type.integer | Type.onServer;
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
//=> 3.141592653589793 true
