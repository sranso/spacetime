'use strict';
global.Unpack = {};
(function () {

var tempHash = new Uint8Array(20);

var extractFileOutput = new Uint32Array(2);

Unpack.unpack = function (pack) {
    var numFiles = (pack[8] << 24) | (pack[9] << 16) | (pack[10] << 8) | pack[11];

    var packOffset = 12;
    var k;
    for (k = 0; k < numFiles; k++) {
        PackData.extractFile(pack, packOffset, extractFileOutput);
        var fileLength = extractFileOutput[0];
        var nextPackOffset = extractFileOutput[1];

        Sha1.hash($file, 0, fileLength, tempHash, 0);
        var pointer = Table.findPointer($table, tempHash, 0);

        if (pointer < 0) {
            pointer = ~pointer;
            Table.setHash($table, pointer, tempHash, 0);
        }
        var pointer32 = pointer >> 2;
        var dataStart = $file.indexOf(0, 6) + 1;
        var typeOffset = Table.typeOffset(pointer);

        if ($file[1] === 'r'.charCodeAt(0)) { // tRee

            //////// Unpack tree

            var moldIndex = Mold.process($mold, fileLength);
            var mold32 = Mold.data32_size * moldIndex;
            var mold8 = Mold.data8_size * moldIndex;
            var mold8Holes = mold8 + Mold.data8_holeOffsets;
            var numHoles = $mold.data8[mold8 + Mold.data8_numHoles];
            $table.data8[typeOffset] = Type.tree | Type.onServer;
            $table.data32[pointer32 + Table.data32_moldIndex] = moldIndex;

            // Set child pointers
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

        } else if ($file[dataStart] === '"'.charCodeAt(0)) {

            /////// Unpack string

            var stringStart = dataStart + 1;
            var length = fileLength - stringStart;
            if (length > Table.dataLongStrings_maxLength) {
                throw new Error('String too long: ' + length);
            } else if (length > 20) {
                $table.data8[typeOffset] = Type.longString | Type.onServer;
                var array = $file.subarray(stringStart, fileLength);
                var string = String.fromCharCode.apply(null, array);
                $table.data32[pointer32] = $table.dataLongStrings.length;
                $table.dataLongStrings.push(string);
            } else {
                if (length < 20) {
                    $table.data8[typeOffset] = Type.string | Type.onServer;
                    $table.data8[pointer + Table.data8_stringLength] = length;
                } else {
                    $table.data8[typeOffset] = Type.string20 | Type.onServer;
                }
                var i;
                for (i = 0; i < length; i++) {
                    $table.data8[pointer + i] = $file[stringStart + i];
                }
            }

        } else if ($file[0] === 'b'.charCodeAt(0)) { // Blob

            /////// Unpack number

            var array = $file.subarray(dataStart, fileLength);
            var number = Number(String.fromCharCode.apply(null, array));
            if (isNaN(number)) {
                throw new Error('Got NaN instead of number');
            } else if (number === (number | 0)) {
                $table.dataInt32[pointer32] = number;
                $table.data8[typeOffset] = Type.integer | Type.onServer;
            } else {
                $table.dataFloat64[(pointer + 4) >> 3] = number;
                $table.data8[typeOffset] = Type.float | Type.onServer;
            }

        } else if ($file[0] === 'c'.charCodeAt(0)) { // Commit

            /////// Unpack commit
            CommitFile.unpack(fileLength, $table.data32, pointer32);
            $table.data8[typeOffset] = Type.commit | Type.onServer;

        } else {
            throw new Error('Commit and Tag not implemented, yet');
        }

        packOffset = nextPackOffset;
    }
};

})();
