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

PackIndex.indexPack = function (index, pack) {
    var numFiles = (pack[8] << 24) | (pack[9] << 16) | (pack[10] << 8) | pack[11];

    var j = 12;
    var k;
    for (k = 0; k < numFiles; k++) {
        var file = PackData.extractFile($PackData, pack, j, $FileCache.heap);
        var fileStart = file[0];
        var fileEnd = file[1];
        var nextPackOffset = file[2];

        Sha1.hash($FileCache.heap.array, fileStart, fileEnd, $, tempHashOffset);
        var hashOffset = HashTable.findHashOffset($HashTable, $, tempHashOffset);
        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
            HashTable.setHash($HashTable, hashOffset, $, tempHashOffset);

            FileCache.registerCachedFile($FileCache, fileStart, fileEnd, hashOffset);
            FileCache.maybeRewindNextOffset($FileCache);

            var deflatedLength = nextPackOffset - j;
            if ($PackData.nextOffset + deflatedLength > $PackData.capacity) {
                PackData.resize($PackData);
            }
            index.offsets[objectIndex] = $PackData.nextOffset;
            var i;
            for (i = 0; i < deflatedLength; i++) {
                $PackData.array[$PackData.nextOffset + i] = pack[j + i];
            }
            $PackData.nextOffset += i;

            j = nextPackOffset;
        } else {
            // TODO: find out if this is ever expected.
            console.log('Received existing sha1 in pack');
        }
    }
};

})();
