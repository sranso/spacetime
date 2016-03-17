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
            var cachedFileStart = found.fileStart;
            var cachedFileEnd = found.fileEnd;

            // Copy file
            var fileLength = cachedFileEnd - cachedFileStart;
            if ($Heap.nextOffset + fileLength > $Heap.capacity) {
                GarbageCollector.resizeHeap($FileSystem, fileLength);
            }
            fileStart = $Heap.nextOffset;
            $Heap.nextOffset += fileLength;
            fileEnd = $Heap.nextOffset;

            var i;
            for (i = 0; i < fileLength; i++) {
                $Heap.array[fileStart + i] = $FileCache.heap.array[cachedFileStart + i];
            }
        }
    } else {
        var packOffset = $PackIndex.offsets[objectIndex];
        var fileRange = PackData.extractFile($PackData, $PackData.array, packOffset, $Heap);
        fileStart = fileRange[0];
        fileEnd = fileRange[1];
    }

    var thing = checkoutFile($Heap.array, fileStart, fileEnd);
    thing.flags = Objects.isFullObject;
    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;

    $Objects.table[objectIndex] = thing;

    return thing;
};

})();
