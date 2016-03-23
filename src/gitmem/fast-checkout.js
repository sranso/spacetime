'use strict';
global.FastCheckout = {};
(function () {

FastCheckout.checkout = function ($s, searchHashOffset, checkoutFile) {
    var hashOffset = HashTable.findHashOffset($HashTable, $s, searchHashOffset);
    var objectIndex = HashTable.objectIndex(hashOffset);
    var found = $Objects.table[objectIndex];
    var fileStart;
    var fileEnd;

    if (found) {
        if (found.flags & Objects.isFullObject) {
            return found;
        } else {
            fileStart = found.fileStart;
            fileEnd = found.fileEnd;
        }
    } else {
        var packOffset = $PackIndex.offsets[objectIndex];
        var fileRange = [];
        PackData.extractFile($PackData.array, packOffset, fileRange);
        fileStart = fileRange[0];
        fileEnd = fileRange[1];

        FileCache.registerCachedFile($FileCache, fileStart, fileEnd, hashOffset);
        FileCache.maybeRewindNextOffset($FileCache);
    }

    var thing = checkoutFile($FileCache.heap.array, fileStart, fileEnd);
    thing.flags = Objects.isFullObject;
    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;

    $Objects.table[objectIndex] = thing;

    return thing;
};

})();
