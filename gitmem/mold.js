'use strict';
global.Mold = {};
(function () {

Mold.create = function (n, arrayCapacity) {
    var hashBits = 0;
    var i = 2 * n;
    while (i > 1) {
        i >>>= 1;
        hashBits++;
    }

    var dataBuffer = new ArrayBuffer(16 * n);

    return {
        fileArray: new Uint8Array(arrayCapacity),

        // Holds both hash and index (2 * n), with max load factor 0.5
        table: new Uint32Array(4 * n),
        data32: new Uint32Array(dataBuffer),
        data8: new Uint8Array(dataBuffer),
        n: n,
        nextIndex: 1,
        nextArrayOffset: 0,
        hashBits: hashBits,
        hashMask: -1 >>> (32 - hashBits),
    };
};

// data32/8 layout (in bytes):
//
// |-- 4 --|-- 4 --|-1-|-1-|-1-|-1-|-1-|-1-|-1-|-1-|
// |       |       |   |   |   |   |               |
// |       |       |   |   |   |   |               |
// |       |       |   |   |   |   | holeOffsets (x4) = data8[12 - 15]
// |       |       |   |   |   | arrayTreeLevel = data8[11]
// |       |       |   |   | numChildren = data8[10]
// |       |       |   | numHoles = data8[9]
// |       |       | treeType = data8[8]
// |       | fileEnd = data32[1]
// | fileStart = data32[0]

Mold.data32_size = 4;
Mold.data32_fileStart = 0;
Mold.data32_fileEnd = 1;
Mold.data8_size = 16;
Mold.data8_treeType = 8
Mold.data8_numHoles = 9
Mold.data8_numChildren = 10;
Mold.data8_arrayTreeLevel = 11;
Mold.data8_holeOffsets = 12;

var holeOffsets = new Uint32Array(10);

Mold.process = function (mold, fileLength) {
    if (fileLength > 255) {
        throw new Error('File is too large to make mold: ' + fileLength);
    }

    // Find hole offsets in file
    var holeIndex = 0;
    var j = $file.indexOf(0, 6) + 1;
    while (j < fileLength) {
        j = $file.indexOf(0, j + 7) + 1;
        holeOffsets[holeIndex] = j;
        j += 20;
        holeIndex++;
    }
    var numHoles = holeIndex;
    if (numHoles > 4) {
        throw new Error('Too many holes in mold: ' + numHoles);
    }

    // Compute FNV-1a hash
    var fnv1a = Fnv1a.start;
    var previousOffset = -20;
    for (j = 0; j < numHoles; j++) {
        var start = previousOffset + 20;
        fnv1a = Fnv1a.update(fnv1a, $file, start, holeOffsets[j]);
        previousOffset = holeOffsets[j];
    }

    // Search table for matching hash
    var h = 2 * (((fnv1a >>> mold.hashBits) ^ fnv1a) & mold.hashMask);
    var moldIndex;

    searchTable:
    while (moldIndex = mold.table[h]) {
        var checkFnv1a = mold.table[h + 1];

        h -= 2;
        if (h < 0) {
            h = mold.table.length - 2;
        }

        if (fnv1a !== checkFnv1a) {
            continue;
        }

        // Make sure mold matches
        var mold8 = moldIndex * Mold.data8_size;
        var mold32 = moldIndex * Mold.data32_size;
        if (numHoles !== mold.data8[mold8 + Mold.data8_numHoles]) {
            continue;
        }

        var moldFileStart = mold.data32[mold32 + Mold.data32_fileStart];
        var previousOffset = -20;
        var mold8Holes = mold8 + Mold.data8_holeOffsets;
        for (j = 0; j < numHoles; j++) {
            var moldHoleOffset = mold.data8[mold8Holes + j];
            if (holeOffsets[j] !== moldHoleOffset) {
                continue searchTable;
            }

            var i;
            for (i = previousOffset + 20; i < moldHoleOffset; i++) {
                if ($file[i] !== mold.fileArray[moldFileStart + i]) {
                    continue searchTable;
                }
            }
            previousOffset = i;
        }

        // Mold found
        return moldIndex;
    }

    // Save new mold
    var moldIndex = mold.nextIndex;
    mold.nextIndex++;
    if (moldIndex === mold.n) {
        throw new Error('Too many molds: ' + moldIndex);
    }

    var moldFileStart = mold.nextArrayOffset;
    var moldFileEnd = moldFileStart + fileLength;
    if (moldFileEnd >= mold.fileArray.length) {
        throw new Error('Molds taking too much space: ' + moldFileEnd);
    }
    mold.nextArrayOffset = moldFileEnd;

    // Copy mold file
    var i;
    for (i = 0; i < fileLength; i++) {
        mold.fileArray[moldFileStart + i] = $file[i];
    }

    // Save data
    var mold8 = moldIndex * Mold.data8_size;
    var mold32 = moldIndex * Mold.data32_size;
    mold.data32[mold32 + Mold.data32_fileStart] = moldFileStart;
    mold.data32[mold32 + Mold.data32_fileEnd] = moldFileEnd;
    mold.data8[mold8 + Mold.data8_treeType] = Type.tree;
    mold.data8[mold8 + Mold.data8_numHoles] = numHoles;
    mold.data8[mold8 + Mold.data8_numChildren] = numHoles;
    mold.data8[mold8 + Mold.data8_arrayTreeLevel] = 0;

    var mold8Holes = mold8 + Mold.data8_holeOffsets;
    for (j = 0; j < numHoles; j++) {
        mold.data8[mold8Holes + j] = holeOffsets[j];
    }

    mold.table[h] = moldIndex;
    mold.table[h + 1] = fnv1a;

    return moldIndex;
};

Mold.fillHoles = function (mold, moldIndex, data32, pointer32) {
    var mold8 = moldIndex * Mold.data8_size;
    var mold32 = moldIndex * Mold.data32_size;
    var numChildren = mold.data8[mold8 + Mold.data8_numChildren];
    var holeOffsets = mold8 + Mold.data8_holeOffsets;
    var fileStart = mold.data32[mold32 + Mold.data32_fileStart];

    var j;
    for (j = 0; j < numChildren; j++) {
        var childPointer = data32[pointer32 + j];
        var holeOffset = fileStart + mold.data8[holeOffsets + j];
        var i;
        for (i = 0; i < 20; i++) {
            mold.fileArray[holeOffset + i] = $table.hashes8[childPointer + i];
        }
    }
};

})();
