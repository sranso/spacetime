'use strict';
require('../helper');

var objects = Objects.create(4);
log(objects.table.length);
//=> 4
log(objects.table[0], objects.table[3]);
//=> null null

global.$HashTable = {array: new Uint8Array(20)};
$HashTable.array[0] = 0x12;
$HashTable.array[1] = 0x34;
$HashTable.array[2] = 0x56;

var object = {
    hashOffset: 0,
    foo: 'bar',
};

// objectIndex would come from HashTable.objectIndex
objects.table[1] = object;
objects.table[3] = object;
log(prettyObjectList(objects.table));
//=> 1: #<123456 foo=bar>
//=> 3: #<123456 foo=bar>
