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
    var fileRange = cloneFile(original.fileStart, original.fileEnd);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    var offset = offsets[prop];
    var type = types[prop];
    var internalHashOffset = fileStart + offset;
    value = mutateFile(internalHashOffset, value, type);
    Sha1.hash($, fileStart, fileEnd, $, tempHashOffset);

    console.log('set1', prop, value);
    var hashOffset = HashTable.findHashOffset($HashTable, tempHashOffset);
    console.log(hashOffset);
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        console.log(hashOffset);
        HashTable.setHash($HashTable, hashOffset, tempHashOffset);
    }
    var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
    var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
    console.log(flagsOffset, $[flagsOffset]);
    if ($[flagsOffset] & HashTable.isObject) {
        $Heap.nextOffset = originalHeapOffset;
        return $HashTable.objects[objectIndex];
    }

    var thing = clone(original);
    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;
    console.log('set', prop, value);
    thing[prop] = value;

    $[flagsOffset] |= HashTable.isObject;
    $HashTable.objects[objectIndex] = thing;

    return thing;
};

FastSet.setAll = function (original, modifications, offsets, types, clone) {
    var originalHeapOffset = $Heap.nextOffset;
    var fileRange = cloneFile(original.fileStart, original.fileEnd);
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
    $HashTable.objects[objectIndex] = thing;

    return thing;
};

var mutateFile = function (internalHashOffset, value, type) {
    if (type === 'object') {
        Tree.setHash(internalHashOffset, value.hashOffset);

        return value;
    } else {
        if (type === 'string') {
            var blobRange = Value.blobFromString(value);
        } else if (type === 'number') {
            var blobRange = Value.blobFromNumber(value);
        } else if (type === 'boolean') {
            var blobRange = Value.blobFromBoolean(value);
        } else {
            throw new Error('Unsupported type: ' + type);
        }

        var blobStart = blobRange[0];
        var blobEnd = blobRange[1];
        Sha1.hash($, blobStart, blobEnd, $, internalHashOffset);

        var hashOffset = HashTable.findHashOffset($HashTable, internalHashOffset);
        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            HashTable.setHash($HashTable, hashOffset, internalHashOffset);
        }
        var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
        var flagsOffset = HashTable.flagsOffset($HashTable, hashOffset);
        if ($[flagsOffset] & HashTable.isObject) {
            return $HashTable.objects[objectIndex].data;
        } else {
            var blobObject = Value.createBlobObject(blobStart, blobEnd, hashOffset, value);

            $[flagsOffset] |= HashTable.isObject;
            console.log('blob', hashOffset, $[flagsOffset]);
            $HashTable.objects[objectIndex] = blobObject;
            return blobObject.data;
        }
    }
};

var cloneFile = function (originalFileBegin, originalFileEnd) {
    var fileLength = originalFileBegin - originalFileEnd;
    if ($Heap.nextOffset + fileLength > $Heap.capacity) {
        FileSystem.expandHeap($Heap, fileLength);
    }
    var fileBegin = $Heap.nextOffset;
    $Heap.nextOffset += fileLength;
    var fileEnd = $Heap.nextOffset;
    var i;
    for (i = 0; i < fileLength; i++) {
        $[fileBegin + i] = $[originalFileBegin + i];
    }

    return [fileBegin, fileEnd];
};

})();
