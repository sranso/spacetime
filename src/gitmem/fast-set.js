'use strict';
global.FastSet = {};
(function () {

var tempHashOffset = -1;
var fileRange = new Uint32Array(2);

FastSet.initialize = function () {
    $heap.nextOffset = 64 * Math.ceil($heap.nextOffset / 64);
    tempHashOffset = $heap.nextOffset;
    $heap.nextOffset += 20;
};

FastSet.set = function (original, prop, value, offsets, types, clone) {
    var $h = $heap.array;
    var originalHeapOffset = $heap.nextOffset;

    copyFile(original.fileStart, original.fileEnd, fileRange);
    var fileStart = fileRange[0];
    var fileEnd = fileRange[1];

    var offset = offsets[prop];
    var type = types[prop];
    var internalHashOffset = fileStart + offset;

    value = mutateFile(internalHashOffset, value, type);
    Sha1.hash($h, fileStart, fileEnd, $h, tempHashOffset);

    var hashOffset = HashTable.findHashOffset($hashTable, $h, tempHashOffset);
    var thing;
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($hashTable, hashOffset, $h, tempHashOffset);
        thing = clone(original);
        $objects.table[HashTable.objectIndex(hashOffset)] = thing;
        $hashTable.array[HashTable.typeOffset(hashOffset)] |= HashTable.isObject;
    } else {
        var typeOffset = HashTable.typeOffset(hashOffset);
        if ($hashTable.array[typeOffset] & HashTable.isObject) {
            $heap.nextOffset = originalHeapOffset;
            return $objects.table[HashTable.objectIndex(hashOffset)];
        }
        thing = clone(original);
        $objects.table[HashTable.objectIndex(hashOffset)] = thing;
        $hashTable.array[typeOffset] |= HashTable.isObject;
    }

    thing.fileStart = fileStart;
    thing.fileEnd = fileEnd;
    thing.hashOffset = hashOffset;
    thing[prop] = value;

    return thing;
};

FastSet.setAll = function (original, modifications, offsets, types, clone) {
    var $h = $heap.array;
    var originalHeapOffset = $heap.nextOffset;

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

    var hashOffset = HashTable.findHashOffset($hashTable, $h, tempHashOffset);
    var thing;
    if (hashOffset < 0) {
        hashOffset = ~hashOffset;
        HashTable.setHash($hashTable, hashOffset, $h, tempHashOffset);
        thing = clone(original);
        $objects.table[HashTable.objectIndex(hashOffset)] = thing;
        $hashTable.array[HashTable.typeOffset(hashOffset)] |= HashTable.isObject;
    } else {
        var typeOffset = HashTable.typeOffset(hashOffset);
        if ($hashTable.array[typeOffset] & HashTable.isObject) {
            $heap.nextOffset = originalHeapOffset;
            return $objects.table[HashTable.objectIndex(hashOffset)];
        }
        thing = clone(original);
        $objects.table[HashTable.objectIndex(hashOffset)] = thing;
        $hashTable.array[typeOffset] |= HashTable.isObject;
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
    var $h = $heap.array;

    if (type === 'object') {
        Tree.setHash($h, internalHashOffset, $h, value.hashOffset);

        return value;
    } else {
        var originalFileCacheOffset = $fileCache.nextArrayOffset;

        Value.createBlob(value, type, fileRange);
        var blobStart = fileRange[0];
        var blobEnd = fileRange[1];
        Sha1.hash($fileCache.array, blobStart, blobEnd, $h, internalHashOffset);

        var valueObject;
        var hashOffset = HashTable.findHashOffset($hashTable, $h, internalHashOffset);
        if (hashOffset < 0) {
            hashOffset = ~hashOffset;
            HashTable.setHash($hashTable, hashOffset, $h, internalHashOffset);
            valueObject = Value.createObject(value);
            $objects.table[HashTable.objectIndex(hashOffset)] = valueObject;
            $hashTable.array[HashTable.typeOffset(hashOffset)] |= HashTable.isObject;
            FileCache.registerCachedFile($fileCache, blobStart, blobEnd, hashOffset);
        } else {
            var typeOffset = HashTable.typeOffset(hashOffset);
            if ($hashTable.array[typeOffset] & HashTable.isObject) {
                $fileCache.nextArrayOffset = originalFileCacheOffset;
                return $objects.table[HashTable.objectIndex(hashOffset)].value;
            }
            valueObject = Value.createObject(value);
            $objects.table[HashTable.objectIndex(hashOffset)] = valueObject;
            $hashTable.array[typeOffset] |= HashTable.isObject;
            FileCache.registerCachedFile($fileCache, blobStart, blobEnd, hashOffset);
        }

        valueObject.hashOffset = hashOffset;

        return valueObject.value;
    }
};

var copyFile = function (originalFileStart, originalFileEnd, fileRange) {
    var fileLength = originalFileEnd - originalFileStart;
    if ($heap.nextOffset + fileLength > $heap.capacity) {
        GarbageCollector.resizeHeap($fileSystem, fileLength);
    }
    var fileStart = $heap.nextOffset;
    $heap.nextOffset += fileLength;
    var fileEnd = $heap.nextOffset;

    var $h = $heap.array;
    var i;
    for (i = 0; i < fileLength; i++) {
        $h[fileStart + i] = $h[originalFileStart + i];
    }

    fileRange[0] = fileStart;
    fileRange[1] = fileEnd;
    return fileRange;
};

})();
