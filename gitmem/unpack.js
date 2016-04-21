'use strict';
global.Unpack = {};
(function () {

var tempHashOffset = -1;

Unpack.initialize = function () {
    $heap.nextOffset = 64 * Math.ceil($heap.nextOffset / 64);
    tempHashOffset = $heap.nextOffset;
    $heap.nextOffset += 20;
};

var fileRange = new Uint32Array(2);

Unpack.unpack = function (pack) {
    var numFiles = (pack[8] << 24) | (pack[9] << 16) | (pack[10] << 8) | pack[11];

    var j = 12;
    var k;
    for (k = 0; k < numFiles; k++) {
        var nextPackOffset = PackData.extractFile(pack, j, fileRange);
        var fileStart = fileRange[0];
        var fileEnd = fileRange[1];

        Sha1.hash($fileCache.array, fileStart, fileEnd, $heap.array, tempHashOffset);
        var hashOffset = HashTable.findHashOffset($hashTable, $heap.array, tempHashOffset);

        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            HashTable.setHash($hashTable, hashOffset, $heap.array, tempHashOffset);
        }

        var dataOffset = hashOffset >> 2;

        if ($fileCache.array[fileStart + 1] === 'r'.charCodeAt(0)) {

            // Unpack tree
            var moldIndex = Mold.process($mold, fileStart, fileEnd);
            var data32_index = Mold.data32_size * moldIndex;
            var moldFileStart = $mold.data32[data32_index + Mold.data32_fileStart];
            var moldFileEnd = $mold.data32[data32_index + Mold.data32_fileEnd];
            var data8_index = Mold.data8_size * moldIndex;
            var data8_holeOffsets = data8_index + Mold.data8_holeOffsets;
            var numHoles = $mold.data8[data8_index + Mold.data8_numHoles];
            $hashTable.data8[HashTable.typeOffset(hashOffset)] = moldIndex;

            var i;
            for (i = 0; i < numHoles; i++) {
                var holeOffset = $mold.data8[data8_holeOffsets + i];
                var searchHashOffset = fileStart + holeOffset;
                var childHashOffset = HashTable.findHashOffset($hashTable, $fileCache.array, searchHashOffset);
                if (childHashOffset < 0) {
                    childHashOffset = ~childHashOffset;
                    HashTable.setHash($hashTable, childHashOffset, $fileCache.array, searchHashOffset);
                    var childTypeOffset = HashTable.typeOffset(childHashOffset);
                    $hashTable.data8[childTypeOffset] = Type.pending;
                }

                $hashTable.data32[dataOffset + i] = childHashOffset;
            }
        } else {

            // Save blob or commit in PackData
            var typeOffset = HashTable.typeOffset(hashOffset);
            if ($fileCache.array[fileStart] === 'b'.charCodeAt(0)) {
                $hashTable.data8[typeOffset] = Type.blob;
            } else if ($fileCache.array[fileStart] === 'c'.charCodeAt(0)) {
                $hashTable.data8[typeOffset] = Type.commit;
            } else {
                $hashTable.data8[typeOffset] = Type.tag;
            }

            var deflatedLength = nextPackOffset - j;
            if ($packData.nextOffset + deflatedLength > $packData.array.length) {
                PackData.resize($packData, deflatedLength);
            }

            var data32_offset = (hashOffset >> 2) + HashTable.data32_packOffset;
            $hashTable.data32[data32_offset] = $packData.nextOffset;

            var i;
            for (i = 0; i < deflatedLength; i++) {
                $packData.array[$packData.nextOffset + i] = pack[j + i];
            }
            $packData.nextOffset += i;
        }

        FileCache.registerCachedFile($fileCache, fileStart, fileEnd, hashOffset);

        j = nextPackOffset;
    }
};

})();
