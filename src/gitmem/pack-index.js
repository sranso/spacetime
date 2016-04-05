'use strict';
global.PackIndex = {};
(function () {

var tempHashOffset = -1;

PackIndex.initialize = function () {
    $Heap.nextOffset = 64 * Math.ceil($Heap.nextOffset / 64);
    tempHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
};

PackIndex.create = function (n) {
    return {
        offsets: new Uint32Array(n),
    };
};

var fileRange = new Uint32Array(2);

PackIndex.indexPack = function (packIndex, pack) {
    var numFiles = (pack[8] << 24) | (pack[9] << 16) | (pack[10] << 8) | pack[11];

    var j = 12;
    var k;
    for (k = 0; k < numFiles; k++) {
        var nextPackOffset = PackData.extractFile(pack, j, fileRange);
        var fileStart = fileRange[0];
        var fileEnd = fileRange[1];

        Sha1.hash($FileCache.array, fileStart, fileEnd, $Heap.array, tempHashOffset);
        var hashOffset = HashTable.findHashOffset($HashTable, $Heap.array, tempHashOffset);
        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            var objectIndex = HashTable.objectIndex(hashOffset);
            HashTable.setHash($HashTable, hashOffset, $Heap.array, tempHashOffset);

            var deflatedLength = nextPackOffset - j;
            if ($PackData.nextOffset + deflatedLength > $PackData.array.length) {
                PackData.resize($PackData, deflatedLength);
            }

            packIndex.offsets[objectIndex] = $PackData.nextOffset;

            var i;
            for (i = 0; i < deflatedLength; i++) {
                $PackData.array[$PackData.nextOffset + i] = pack[j + i];
            }
            $PackData.nextOffset += i;

            FileCache.registerCachedFile($FileCache, fileStart, fileEnd, hashOffset);

            j = nextPackOffset;
        } else {
            // TODO: find out if this is ever expected.
            console.log('Received existing sha1 in pack');
        }
    }
};

})();
