'use strict';
(function () {

var fileRange = new Uint32Array(2);
var tempHash = new Uint8Array(20);

global.hash = function (value) {
    var blobLength;
    var type;
    switch (typeof value) {
    case 'string':
        if (value.length > 19) {
            throw new Error('String too long: ' + value.length);
        }
        blobLength = Blob.create('"' + value);
        type = Type.string;
        break;
    case 'number':
        blobLength = Blob.create('' + value);
        if (value === (value | 0)) {
            type = Type.integer;
        } else {
            type = Type.float;
        }
        break;
    default:
        throw new Error('Unsupported type: ' + (typeof value));
    }

    Sha1.hash($file, 0, blobLength, tempHash, 0);
    var hashOffset = HashTable.findHashOffset($hashTable, tempHash, 0);

    if (hashOffset > 0) {
        return hashOffset;
    }

    hashOffset = ~hashOffset;
    HashTable.setHash($hashTable, hashOffset, tempHash, 0);
    $hashTable.data8[HashTable.typeOffset(hashOffset)] = type;

    switch (type) {
    case Type.string:
        $hashTable.data8[hashOffset + HashTable.data8_stringLength] = value.length;
        var i;
        for (i = 0; i < value.length; i++) {
            $hashTable.data8[hashOffset + i] = value.charCodeAt(i);
        }
        break;
    case Type.integer:
        $hashTable.dataInt32[hashOffset >> 2] = value;
        break;
    case Type.float:
        $hashTable.dataFloat64[(hashOffset + 4) >> 3] = value;
        break;
    }

    return hashOffset;
};

})();
