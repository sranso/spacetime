'use strict';
global.FastCheckout = {};
(function () {

var fileRange = new Uint32Array(2);

FastCheckout.checkout = function ($s, searchHashOffset, checkoutFile) {
    var hashOffset = HashTable.findHashOffset($HashTable, $s, searchHashOffset);
    var objectIndex = HashTable.objectIndex(hashOffset);
    var typeOffset = HashTable.typeOffset(hashOffset);
    var type = $HashTable.array[typeOffset];
    if (type & HashTable.isObject) {
        return $Objects.table[objectIndex];
    }

    var fileStart;
    var fileEnd;
    if (type & HashTable.isFileCached) {
        var cacheIndex = $PackIndex.offsets[objectIndex];
        fileStart = $FileCache.fileStarts[cacheIndex];
        fileEnd = $FileCache.fileEnds[cacheIndex];
    } else {
        var packOffset = $PackIndex.offsets[objectIndex];
        PackData.extractFile($PackData.array, packOffset, fileRange);
        fileStart = fileRange[0];
        fileEnd = fileRange[1];

        FileCache.registerCachedFile($FileCache, fileStart, fileEnd, hashOffset);
    }

    var thing = checkoutFile($FileCache.array, fileStart, fileEnd);
    thing.hashOffset = hashOffset;

    $HashTable.array[typeOffset] |= HashTable.isObject;
    $Objects.table[objectIndex] = thing;

    return thing;
};

})();
