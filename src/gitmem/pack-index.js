'use strict';
global.PackIndex = {};
(function () {

var tempHashOffset = -1;

PackIndex.initialize = function () {
    $heap.nextOffset = 64 * Math.ceil($heap.nextOffset / 64);
    tempHashOffset = $heap.nextOffset;
    $heap.nextOffset += 20;
};

var fileRange = new Uint32Array(2);

PackIndex.indexPack = function (pack) {
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

            FileCache.registerCachedFile($fileCache, fileStart, fileEnd, hashOffset);

            j = nextPackOffset;
        } else {
            // TODO: find out if this is ever expected.
            console.log('Received existing sha1 in pack');
        }
    }
};

})();
