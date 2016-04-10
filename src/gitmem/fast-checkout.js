'use strict';
global.FastCheckout = {};
(function () {

var fileRange = new Uint32Array(2);

FastCheckout.checkout = function ($s, searchHashOffset, checkoutFile) {
    var hashOffset = HashTable.findHashOffset($hashTable, $s, searchHashOffset);
    var objectIndex = HashTable.objectIndex(hashOffset);
    var typeOffset = HashTable.typeOffset(hashOffset);
    var type = $hashTable.hashes8[typeOffset];
    if (type & HashTable.isObject) {
        return $hashTable.objects[objectIndex];
    }

    var fileStart;
    var fileEnd;
    if (type & HashTable.isFileCached) {
        var data32_offset = (hashOffset >> 2) + HashTable.data32_cacheIndex;
        var cacheIndex = $hashTable.data32[data32_offset];
        fileStart = $fileCache.fileStarts[cacheIndex];
        fileEnd = $fileCache.fileEnds[cacheIndex];
    } else {
        var data32_offset = (hashOffset >> 2) + HashTable.data32_packOffset;
        var packOffset = $hashTable.data32[data32_offset];
        PackData.extractFile($packData.array, packOffset, fileRange);
        fileStart = fileRange[0];
        fileEnd = fileRange[1];

        FileCache.registerCachedFile($fileCache, fileStart, fileEnd, hashOffset);
    }

    var thing = checkoutFile($fileCache.array, fileStart, fileEnd);
    thing.hashOffset = hashOffset;

    $hashTable.hashes8[typeOffset] |= HashTable.isObject;
    $hashTable.objects[objectIndex] = thing;

    return thing;
};

})();
