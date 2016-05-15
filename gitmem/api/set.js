'use strict';
(function () {

var newPointers = new Uint32Array(4);
var tempHash = new Uint8Array(20);

global.set = function (pointer) {
    var pointer32 = pointer >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];

    // Set newPointers
    var j;
    for (j = 0; j < numChildren; j++) {
        newPointers[j] = $table.data32[pointer32 + j];
    }

    for (j = 1; j < arguments.length; j += 2) {
        var childIndex = arguments[j];
        if (childIndex >= numChildren) {
            throw new Error('Trying to set child ' + childIndex + ' out of ' + numChildren);
        }
        newPointers[childIndex] = arguments[j + 1];
    }

    return set._create(moldIndex, newPointers);
};

set._create = function (moldIndex, newPointers) {
    var mold8 = moldIndex * Mold.data8_size;
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];

    // Write to mold
    var mold32 = moldIndex * Mold.data32_size;
    var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
    var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
    var holeOffsets = mold8 + Mold.data8_holeOffsets;
    var j;
    for (j = 0; j < numChildren; j++) {
        var childPointer = newPointers[j];
        var holeOffset = fileStart + $mold.data8[holeOffsets + j];
        var i;
        for (i = 0; i < 20; i++) {
            $mold.fileArray[holeOffset + i] = $table.hashes8[childPointer + i];
        }
    }

    // Hash and store in table
    Sha1.hash($mold.fileArray, fileStart, fileEnd, tempHash, 0);
    var pointer = Table.findPointer($table, tempHash, 0);
    if (pointer > 0) {
        return pointer;
    }

    pointer = ~pointer;
    Table.setHash($table, pointer, tempHash, 0);
    var pointer32 = pointer >> 2;
    $table.data8[Table.typeOffset(pointer)] = Type.tree;
    $table.data32[pointer32 + Table.data32_moldIndex] = moldIndex;
    for (j = 0; j < numChildren; j++) {
        $table.data32[pointer32 + j] = newPointers[j];
    }

    return pointer;
};

})();
