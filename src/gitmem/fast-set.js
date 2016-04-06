'use strict';
global.FastSet = {};
(function () {

var tempHashOffset = -1;
var fileRange = new Uint32Array(2);

FastSet.initialize = function () {
    $Heap.nextOffset = 64 * Math.ceil($Heap.nextOffset / 64);
    tempHashOffset = $Heap.nextOffset;
    $Heap.nextOffset += 20;
};

FastSet.set = function (original, prop, value, offsets, types, clone) {
    var $h = $Heap.array;
    var originalHeapOffset = $Heap.nextOffset;

    copyFile(original.fileStart, original.fileEnd, fileRange);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    var offset = offsets[prop];
    var type = types[prop];
    var internalHashOffset = fileStart + offset;

    value = mutateFile(internalHashOffset, value, type);
    Sha1.hash($h, fileStart, fileEnd, $h, tempHashOffset);

    var hashOffset = HashTable.findHashOffset($HashTable, $h, tempHashOffset);
    var thing;
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($HashTable, hashOffset, $h, tempHashOffset);
        thing = clone(original);
        $Objects.table[HashTable.objectIndex(hashOffset)] = thing;
        $HashTable.array[HashTable.typeOffset(hashOffset)] |= HashTable.isObject;
    } else {
        var typeOffset = HashTable.typeOffset(hashOffset);
        if ($HashTable.array[typeOffset] & HashTable.isObject) {
            $Heap.nextOffset = originalHeapOffset;
            return $Objects.table[HashTable.objectIndex(hashOffset)];
        }
        thing = clone(original);
        $Objects.table[HashTable.objectIndex(hashOffset)] = thing;
        $HashTable.array[typeOffset] |= HashTable.isObject;
    }

    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;
    thing[prop] = value;

    return thing;
};

FastSet.setAll = function (original, modifications, offsets, types, clone) {
    var $h = $Heap.array;
    var originalHeapOffset = $Heap.nextOffset;

    copyFile(original.fileStart, original.fileEnd, fileRange);
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
    Sha1.hash($h, fileStart, fileEnd, $h, tempHashOffset);

    var hashOffset = HashTable.findHashOffset($HashTable, $h, tempHashOffset);
    var thing;
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($HashTable, hashOffset, $h, tempHashOffset);
        thing = clone(original);
        $Objects.table[HashTable.objectIndex(hashOffset)] = thing;
        $HashTable.array[HashTable.typeOffset(hashOffset)] |= HashTable.isObject;
    } else {
        var typeOffset = HashTable.typeOffset(hashOffset);
        if ($HashTable.array[typeOffset] & HashTable.isObject) {
            $Heap.nextOffset = originalHeapOffset;
            return $Objects.table[HashTable.objectIndex(hashOffset)];
        }
        thing = clone(original);
        $Objects.table[HashTable.objectIndex(hashOffset)] = thing;
        $HashTable.array[typeOffset] |= HashTable.isObject;
    }

    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;
    for (prop in modifications) {
        thing[prop] = modifications[prop];
    }

    return thing;
};

var mutateFile = function (internalHashOffset, value, type) {
    var $h = $Heap.array;

    if (type === 'object') {
        Tree.setHash($h, internalHashOffset, $h, value.hashOffset);

        return value;
    } else {
        var originalHeapOffset = $Heap.nextOffset;

        Value.createBlob(value, type, fileRange);
        var blobStart = fileRange[0];
        var blobEnd = fileRange[1];
        Sha1.hash($h, blobStart, blobEnd, $h, internalHashOffset);

        var valueObject;
        var hashOffset = HashTable.findHashOffset($HashTable, $h, internalHashOffset);
        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            HashTable.setHash($HashTable, hashOffset, $h, internalHashOffset);
            valueObject = Value.createObject(value);
            $Objects.table[HashTable.objectIndex(hashOffset)] = valueObject;
            $HashTable.array[HashTable.typeOffset(hashOffset)] |= HashTable.isObject;
        } else {
            var typeOffset = HashTable.typeOffset(hashOffset);
            if ($HashTable.array[typeOffset] & HashTable.isObject) {
                $Heap.nextOffset = originalHeapOffset;
                return $Objects.table[HashTable.objectIndex(hashOffset)].value;
            }
            valueObject = Value.createObject(value);
            $Objects.table[HashTable.objectIndex(hashOffset)] = valueObject;
            $HashTable.array[typeOffset] |= HashTable.isObject;
        }

        valueObject.fileStart = blobStart;
        valueObject.fileEnd = blobEnd;
        valueObject.hashOffset = hashOffset;

        return valueObject.value;
    }
};

var copyFile = function (originalFileStart, originalFileEnd, fileRange) {
    var fileLength = originalFileEnd - originalFileStart;
    if ($Heap.nextOffset + fileLength > $Heap.capacity) {
        GarbageCollector.resizeHeap($FileSystem, fileLength);
    }
    var fileStart = $Heap.nextOffset;
    $Heap.nextOffset += fileLength;
    var fileEnd = $Heap.nextOffset;

    var $h = $Heap.array;
    var i;
    for (i = 0; i < fileLength; i++) {
        $h[fileStart + i] = $h[originalFileStart + i];
    }

    fileRange[0] = fileStart;
    fileRange[1] = fileEnd;
    return fileRange;
};

})();
