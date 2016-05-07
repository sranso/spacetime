'use strict';
global.Mold = {};
(function () {

Mold.create = function (n, arrayCapacity, indexStart) {
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
        nextIndex: indexStart,
        nextArrayOffset: 0,
        hashBits: hashBits,
        hashMask: -1 >>> (32 - hashBits),
    };
};

// data32/8 layout (in bytes):
//
// |-- 4 --|-- 4 --|-1-|-1-|-1-|-1-|-1-|-1-|-1-|-1-|
// |       |       |   |   |   |                   |
// |       |       |   |   |   | holeOffsets (x5) = data8[11 - 15]
// |       |       |   |   | treeHeight = data8[10]
// |       |       |   | numChildren = data8[9]
// |       |       | numHoles = data8[8]
// |       | fileEnd = data32[1]
// | fileStart = data32[0]

Mold.data32_size = 4;
Mold.data32_fileStart = 0;
Mold.data32_fileEnd = 1;
Mold.data8_size = 16;
Mold.data8_numHoles = 8
Mold.data8_numChildren = 9;
Mold.data8_treeHeight = 10;
Mold.data8_holeOffsets = 11;

var holeOffsets = new Uint32Array(6);

Mold.process = function (mold, fileStart, fileEnd) {
    if (fileEnd - fileStart > 255) {
        throw new Error('File is too large to make mold: ' + (fileEnd - fileStart));
    }

    // Find hole offsets in file
    var holeIndex = 0;
    var j = $fileCache.array.indexOf(0, fileStart + 6) + 1;
    while (j < fileEnd) {
        j = $fileCache.array.indexOf(0, j + 7) + 1;
        holeOffsets[holeIndex] = j;
        j += 20;
        holeIndex++;
    }
    var numHoles = holeIndex;
    if (numHoles > 5) {
        throw new Error('Too many holes in mold: ' + numHoles);
    }

    // Compute FNV-1a hash
    var hash = Fnv1a.startHash;
    var previousOffset = fileStart - 20;
    for (j = 0; j < numHoles; j++) {
        var start = previousOffset + 20;
        hash = Fnv1a.update(hash, $fileCache.array, start, holeOffsets[j]);
        previousOffset = holeOffsets[j];
    }

    // Search table for matching hash
    var h = 2 * (((hash >>> mold.hashBits) ^ hash) & mold.hashMask);
    var moldIndex;

    searchTable:
    while (moldIndex = mold.table[h]) {
        var checkHash = mold.table[h + 1];

        h -= 2;
        if (h < 0) {
            h = mold.table.length - 2;
        }

        if (checkHash !== hash) {
            continue;
        }

        // Make sure mold matches
        var data8_index = moldIndex * Mold.data8_size;
        var data32_index = moldIndex * Mold.data32_size;
        var moldNumHoles = mold.data8[data8_index + Mold.data8_numHoles];
        if (moldNumHoles !== numHoles) {
            continue;
        }

        var moldFileStart = mold.data32[data32_index + Mold.data32_fileStart];
        var previousOffset = -20;
        var data8_holeOffsets = data8_index + Mold.data8_holeOffsets;
        for (j = 0; j < numHoles; j++) {
            var moldHoleOffset = mold.data8[data8_holeOffsets + j];
            if (moldHoleOffset !== (holeOffsets[j] - fileStart)) {
                continue searchTable;
            }

            var i;
            for (i = previousOffset + 20; i < moldHoleOffset; i++) {
                if ($fileCache.array[fileStart + i] !== mold.fileArray[moldFileStart + i]) {
                    continue searchTable;
                }
            }
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

    var fileLength = fileEnd - fileStart;
    var moldFileStart = mold.nextArrayOffset;
    var moldFileEnd = moldFileStart + fileLength;
    if (moldFileEnd >= mold.fileArray.length) {
        throw new Error('Molds taking too much space: ' + moldFileEnd);
    }
    mold.nextArrayOffset = moldFileEnd;

    // Copy mold file
    var i;
    for (i = 0; i < fileLength; i++) {
        mold.fileArray[moldFileStart + i] = $fileCache.array[fileStart + i];
    }

    // Save data
    var data8_index = moldIndex * Mold.data8_size;
    var data32_index = moldIndex * Mold.data32_size;
    mold.data32[data32_index + Mold.data32_fileStart] = moldFileStart;
    mold.data32[data32_index + Mold.data32_fileEnd] = moldFileEnd;
    mold.data8[data8_index + Mold.data8_numHoles] = numHoles;
    mold.data8[data8_index + Mold.data8_numChildren] = numHoles;

    var data8_holeOffsets = data8_index + Mold.data8_holeOffsets;
    for (j = 0; j < numHoles; j++) {
        mold.data8[data8_holeOffsets + j] = holeOffsets[j] - fileStart;
    }

    mold.table[h] = moldIndex;
    mold.table[h + 1] = hash;

    return moldIndex;
};

})();