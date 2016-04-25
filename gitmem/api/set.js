'use strict';
global.Set = {};
(function () {

var newHashOffsets = new Uint32Array(5);
var tempHash = new Uint8Array(20);

global.set = function (hashOffset) {
    var dataOffset = hashOffset >> 2;
    var moldIndex = $hashTable.data8[HashTable.typeOffset(hashOffset)];
    var data8_index = moldIndex * Mold.data8_size;
    var numChildren = $mold.data8[data8_index + Mold.data8_numChildren];

    // Set newHashOffsets
    var j;
    for (j = 0; j < numChildren; j++) {
        newHashOffsets[j] = $hashTable.data32[dataOffset + j];
    }

    for (j = 1; j < arguments.length; j += 2) {
        var childIndex = arguments[j];
        if (childIndex >= numChildren) {
            throw new Error('Trying to set child ' + childIndex + ' out of ' + numChildren);
        }
        newHashOffsets[childIndex] = arguments[j + 1];
    }

    // Write to mold
    var data32_index = moldIndex * Mold.data32_size;
    var fileStart = $mold.data32[data32_index + Mold.data32_fileStart];
    var fileEnd = $mold.data32[data32_index + Mold.data32_fileEnd];
    var data8_holeOffsets = data8_index + Mold.data8_holeOffsets;
    for (j = 0; j < numChildren; j++) {
        var childHashOffset = newHashOffsets[j];
        var holeOffset = fileStart + $mold.data8[data8_holeOffsets + j];
        var i;
        for (i = 0; i < 20; i++) {
            $mold.fileArray[holeOffset + i] = $hashTable.hashes8[hashOffset + i];
        }
    }

    // Hash and store in table
    Sha1.hash($mold.fileArray, fileStart, fileEnd, tempHash, 0);
    hashOffset = HashTable.findHashOffset($hashTable, tempHash, 0);
    if (hashOffset > 0) {
        return hashOffset;
    }

    hashOffset = ~hashOffset;
    HashTable.setHash($hashTable, hashOffset, tempHash, 0);
    $hashTable.data8[HashTable.typeOffset(hashOffset)] = moldIndex;
    dataOffset = hashOffset >> 2;
    for (j = 0; j < numChildren; j++) {
        $hashTable.data32[dataOffset + j] = newHashOffsets[j];
    }

    return hashOffset;
};

})();
