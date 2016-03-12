'use strict';
global.FastSet = {};
(function () {

var tempHashOffset = -1;

FastSet.initialize = function () {
    $Heap.nextOffset = 64 * Math.ceil($Heap.nextOffset / 64);
    tempHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
};

FastSet.set = function (original, prop, value, offsets, types, clone) {
    var originalHeapOffset = $Heap.nextOffset;

    var fileRange = copyFile(original.fileStart, original.fileEnd);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    var offset = offsets[prop];
    var type = types[prop];
    var internalHashOffset = fileStart + offset;

    value = mutateFile(internalHashOffset, value, type);
    Sha1.hash($, fileStart, fileEnd, $, tempHashOffset);

    var hashOffset = HashTable.findHashOffset($HashTable, tempHashOffset);
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($HashTable, hashOffset, tempHashOffset);
    }
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
    if ($[flagsOffset] & HashTable.isObject) {
        $Heap.nextOffset = originalHeapOffset;
        return $HashTable.objects[objectIndex];
    }

    var thing = clone(original);
    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;
    thing[prop] = value;

    $[flagsOffset] |= HashTable.isObject;
    $[flagsOffset] &= ~HashTable.isCachedFile;
    $HashTable.objects[objectIndex] = thing;

    return thing;
};

FastSet.setAll = function (original, modifications, offsets, types, clone) {
    var originalHeapOffset = $Heap.nextOffset;

    var fileRange = copyFile(original.fileStart, original.fileEnd);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    var prop;
    for (prop in modifications) {
        var value = modifications[prop];
        var offset = offsets[prop];
        var type = types[prop];
        var internalHashOffset = fileStart + offset;

        modifications[prop] = mutateFile(internalHashOffset, value, type);
    }
    Sha1.hash($, fileStart, fileEnd, $, tempHashOffset);

    var hashOffset = HashTable.findHashOffset($HashTable, tempHashOffset);
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($HashTable, hashOffset, tempHashOffset);
    }
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
    if ($[flagsOffset] & HashTable.isObject) {
        $Heap.nextOffset = originalHeapOffset;
        return $HashTable.objects[objectIndex];
    }

    var thing = clone(original);
    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;
    for (prop in modifications) {
        thing[prop] = modifications[prop];
    }

    $[flagsOffset] |= HashTable.isObject;
    $[flagsOffset] &= ~HashTable.isCachedFile;
    $HashTable.objects[objectIndex] = thing;

    return thing;
};

var mutateFile = function (internalHashOffset, value, type) {
    if (type === 'object') {
        Tree.setHash(internalHashOffset, value.hashOffset);

        return value;
    } else {
        var fileRange = Value.createBlob(type, value);
        var fileStart = fileRange[0];
        var fileEnd = fileRange[1];
        Sha1.hash($, fileStart, fileEnd, $, internalHashOffset);

        var hashOffset = HashTable.findHashOffset($HashTable, internalHashOffset);
        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            HashTable.setHash($HashTable, hashOffset, internalHashOffset);
        }
        var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
        var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
        if ($[flagsOffset] & HashTable.isObject) {
            return $HashTable.objects[objectIndex].value;
        } else {
            var valueObject = Value.createObject(value);
            valueObject.fileStart = fileStart;
            valueObject.fileEnd = fileEnd;
            valueObject.hashOffset = hashOffset;

            $[flagsOffset] |= HashTable.isObject;
            $[flagsOffset] &= ~HashTable.isCachedFile;
            $HashTable.objects[objectIndex] = valueObject;
            return valueObject.value;
        }
    }
};

var copyFile = function (originalFileStart, originalFileEnd) {
    var fileLength = originalFileEnd - originalFileStart;
    if ($Heap.nextOffset + fileLength > $Heap.capacity) {
        FileSystem.expandHeap($Heap, fileLength);
    }
    var fileStart = $Heap.nextOffset;
    $Heap.nextOffset += fileLength;
    var fileEnd = $Heap.nextOffset;

    var i;
    for (i = 0; i < fileLength; i++) {
        $[fileStart + i] = $[originalFileStart + i];
    }

    return [fileStart, fileEnd];
};

})();
