'use strict';
global.Unpack = {};
(function () {

var tempHash = new Uint8Array(20);

var extractFileOutput = new Uint32Array(2);

Unpack.unpack = function (pack) {
    var numFiles = (pack[8] << 24) | (pack[9] << 16) | (pack[10] << 8) | pack[11];

    var j = 12;
    var k;
    for (k = 0; k < numFiles; k++) {
        PackData.extractFile(pack, j, extractFileOutput);
        var fileLength = extractFileOutput[0];
        var nextPackOffset = extractFileOutput[1];

        Sha1.hash($file, 0, fileLength, tempHash, 0);
        var hashOffset = HashTable.findHashOffset($hashTable, tempHash, 0);

        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            HashTable.setHash($hashTable, hashOffset, tempHash, 0);
        }

        if ($file[1] === 'r'.charCodeAt(0)) {

            // Unpack tree
            var moldIndex = Mold.process($mold, fileLength);
            var data32_index = Mold.data32_size * moldIndex;
            var moldFileStart = $mold.data32[data32_index + Mold.data32_fileStart];
            var moldFileEnd = $mold.data32[data32_index + Mold.data32_fileEnd];
            var data8_index = Mold.data8_size * moldIndex;
            var data8_holeOffsets = data8_index + Mold.data8_holeOffsets;
            var numHoles = $mold.data8[data8_index + Mold.data8_numHoles];
            var dataOffset = hashOffset >> 2;
            $hashTable.data8[HashTable.typeOffset(hashOffset)] = Type.tree;
            $hashTable.data32[dataOffset + HashTable.data32_moldIndex] = moldIndex;

            var i;
            for (i = 0; i < numHoles; i++) {
                var holeOffset = $mold.data8[data8_holeOffsets + i];
                var childHashOffset = HashTable.findHashOffset($hashTable, $file, holeOffset);
                if (childHashOffset < 0) {
                    childHashOffset = ~childHashOffset;
                    HashTable.setHash($hashTable, childHashOffset, $file, holeOffset);
                    var childTypeOffset = HashTable.typeOffset(childHashOffset);
                    $hashTable.data8[childTypeOffset] = Type.pending;
                }

                $hashTable.data32[dataOffset + i] = childHashOffset;
            }
        } else {

            // Save blob or commit in PackData
            var typeOffset = HashTable.typeOffset(hashOffset);
            if ($file[0] === 'b'.charCodeAt(0)) {
                $hashTable.data8[typeOffset] = Type.blob;
            } else if ($file[0] === 'c'.charCodeAt(0)) {
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

        j = nextPackOffset;
    }
};

})();
