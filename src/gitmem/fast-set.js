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
    var thing;
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($HashTable, hashOffset, tempHashOffset);
        thing = clone(original);
        $Objects.table[HashTable.objectIndex($HashTable, hashOffset)] = thing;
    } else {
        var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
        var found = $Objects.table[objectIndex];
        if (found && (found.flags & Objects.isFullObject)) {
            $Heap.nextOffset = originalHeapOffset;
            return found;
        }
        thing = clone(original);
        $Objects.table[objectIndex] = thing;
    }

    thing.flags = Objects.isFullObject;
    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;
    thing[prop] = value;

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
    var thing;
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($HashTable, hashOffset, tempHashOffset);
        thing = clone(original);
        $Objects.table[HashTable.objectIndex($HashTable, hashOffset)] = thing;
    } else {
        var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
        var found = $Objects.table[objectIndex];
        if (found && (found.flags & Objects.isFullObject)) {
            $Heap.nextOffset = originalHeapOffset;
            return found;
        }
        thing = clone(original);
        $Objects.table[objectIndex] = thing;
    }

    thing.flags = Objects.isFullObject;
    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;
    for (prop in modifications) {
        thing[prop] = modifications[prop];
    }

    return thing;
};

var mutateFile = function (internalHashOffset, value, type) {
    if (type === 'object') {
        Tree.setHash(internalHashOffset, value.hashOffset);

        return value;
    } else {
        var originalHeapOffset = $Heap.nextOffset;

        var fileRange = Value.createBlob(type, value);
        var fileStart = fileRange[0];
        var fileEnd = fileRange[1];
        Sha1.hash($, fileStart, fileEnd, $, internalHashOffset);

        var valueObject;
        var hashOffset = HashTable.findHashOffset($HashTable, internalHashOffset);
        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            HashTable.setHash($HashTable, hashOffset, internalHashOffset);
            valueObject = Value.createObject(value);
            $Objects.table[HashTable.objectIndex($HashTable, hashOffset)] = valueObject;
        } else {
            var objectIndex = HashTable.objectIndex($HashTable, hashOffset);
            var found = $Objects.table[objectIndex];
            if (found && (found.flags & Objects.isFullObject)) {
                $Heap.nextOffset = originalHeapOffset;
                return found.value;
            }
            valueObject = Value.createObject(value);
            $Objects.table[objectIndex] = valueObject;
        }

        valueObject.flags = Objects.isFullObject;
        valueObject.fileStart = fileStart;
        valueObject.fileEnd = fileEnd;
        valueObject.hashOffset = hashOffset;

        return valueObject.value;
    }
};

var copyFile = function (originalFileStart, originalFileEnd) {
    var fileLength = originalFileEnd - originalFileStart;
    if ($Heap.nextOffset + fileLength > $Heap.capacity) {
        GarbageCollector.resizeHeap($FileSystem, fileLength);
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
