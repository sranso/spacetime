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
        var pointer = Table.findPointer($table, tempHash, 0);

        if (pointer < 0) {
            pointer = ~pointer;
            Table.setHash($table, pointer, tempHash, 0);
        }

        if ($file[1] === 'r'.charCodeAt(0)) {

            // Unpack tree
            var moldIndex = Mold.process($mold, fileLength);
            var mold32 = Mold.data32_size * moldIndex;
            var mold8 = Mold.data8_size * moldIndex;
            var mold8Holes = mold8 + Mold.data8_holeOffsets;
            var numHoles = $mold.data8[mold8 + Mold.data8_numHoles];
            var pointer32 = pointer >> 2;
            $table.data8[Table.typeOffset(pointer)] = Type.tree;
            $table.data32[pointer32 + Table.data32_moldIndex] = moldIndex;

            var i;
            for (i = 0; i < numHoles; i++) {
                var holeOffset = $mold.data8[mold8Holes + i];
                var childPointer = Table.findPointer($table, $file, holeOffset);
                if (childPointer < 0) {
                    childPointer = ~childPointer;
                    Table.setHash($table, childPointer, $file, holeOffset);
                    $table.data8[Table.typeOffset(childPointer)] = Type.pending;
                }

                $table.data32[pointer32 + i] = childPointer;
            }
        } else {

            // Save blob or commit in PackData
            var typeOffset = Table.typeOffset(pointer);
            if ($file[0] === 'b'.charCodeAt(0)) {
                $table.data8[typeOffset] = Type.blob;
            } else if ($file[0] === 'c'.charCodeAt(0)) {
                $table.data8[typeOffset] = Type.commit;
            } else {
                $table.data8[typeOffset] = Type.tag;
            }

            var deflatedLength = nextPackOffset - j;
            if ($packData.nextOffset + deflatedLength > $packData.array.length) {
                PackData.resize($packData, deflatedLength);
            }

            var data32_offset = (pointer >> 2) + Table.data32_packOffset;
            $table.data32[data32_offset] = $packData.nextOffset;

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
