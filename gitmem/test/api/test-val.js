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

var num1Number = 42;
var num1BlobLength = Blob.create('' + num1Number);
var num1Hash = new Uint8Array(20);
Sha1.hash($file, 0, num1BlobLength, num1Hash, 0);

var num1 = ~Table.findPointer($table, num1Hash, 0);
Table.setHash($table, num1, num1Hash, 0);
Convert.stringToExistingArray($table.data8, num1, '' + num1Number);
$table.data8[Table.typeOffset(num1)] = Type.integer;
$table.dataInt32[num1 >> 2] = num1Number;
log(val(num1), val(num1) === num1Number);
//=> 42 true

var num2Number = 375.20351695201254;
var num2BlobLength = Blob.create('' + num2Number);
var num2Hash = new Uint8Array(20);
Sha1.hash($file, 0, num2BlobLength, num2Hash, 0);

var num2 = ~Table.findPointer($table, num2Hash, 0);
Table.setHash($table, num2, num2Hash, 0);
Convert.stringToExistingArray($table.data8, num2, '' + num2Number);
$table.data8[Table.typeOffset(num2)] = Type.float;
$table.dataFloat64[(num2 + 4) >> 3] = num2Number;
log(val(num2), val(num2) === num2Number);
//=> 375.20351695201254 true
