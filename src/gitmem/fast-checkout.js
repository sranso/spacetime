'use strict';
global.FastCheckout = {};
(function () {

FastCheckout.checkout = function (searchHashOffset, checkoutFile) {
    var hashOffset = HashTable.findHashOffset($HashTable, searchHashOffset);
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
    if ($[flagsOffset] & HashTable.isObject) {
        return $HashTable.objects[objectIndex];
    }

    if ($[flagsOffset] & HashTable.isCachedFile) {
        var cachedFile = $HashTable.objects[objectIndex];
        var cachedFileStart = cachedFile.fileStart;
        var cachedFileEnd = cachedFile.fileEnd;

        $[flagsOffset] &= ~HashTable.isCachedFile;

        // Copy file
        var fileLength = cachedFileEnd - cachedFileStart;
        if ($Heap.nextOffset + fileLength > $Heap.capacity) {
            FileSystem.expandHeap($Heap, fileLength);
        }
        var fileStart = $Heap.nextOffset;
        $Heap.nextOffset += fileLength;
        var fileEnd = $Heap.nextOffset;

        var i;
        for (i = 0; i < fileLength; i++) {
            $[fileStart + i] = $FileCache.heap.array[cachedFileStart + i];
        }
    } else {
        var packOffset = $PackIndex.offsets[objectIndex];
        var fileRange = PackData.extractFile($PackData, $PackData.array, packOffset, $Heap);
        var fileStart = fileRange[0];
        var fileEnd = fileRange[1];
    }

    var thing = checkoutFile(fileStart, fileEnd);
    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;

    $HashTable.objects[objectIndex] = thing;
    $[flagsOffset] |= HashTable.isObject;

    return thing;
};

})();
