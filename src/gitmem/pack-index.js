'use strict';
global.PackIndex = {};
(function () {

var fileForCreate = new Uint8Array(65536);

PackIndex.create = function (pack) {
    var packContentsEnd = pack.length - 20;

    var numFiles = (pack[8] << 24) | (pack[9] << 16) | (pack[10] << 8) | pack[11];
    var hashes = new Uint8Array(20 * numFiles);
    var offsets = new Uint32Array(numFiles);
    var sortTargets = new Uint32Array(numFiles);

    var j = 12;
    var hashOffset = 0;
    var k = 0;
    var i;
    for (i = 0; i < numFiles; i++) {
        var ex = Pack.extractFile(pack, j, fileForCreate, k);
        if (!ex[0]) {
            if (ex[1] > fileForCreate.length) {
                var newLength = 4096 * Math.ceil(ex[1] / 4096);
                fileForCreate = new Uint8Array(newLength);
            }
            k = 0;
            ex = Pack.extractFile(pack, j, fileForCreate, k);
        }

        var file = fileForCreate.subarray(k, ex[1]);
        Sha1.hash(file, hashes, hashOffset);
        offsets[i] = j;
        sortTargets[i] = i;
        j = ex[0];
        k = ex[1];
        hashOffset += 20;
    }

    sortTargets.sort(function (a, b) {
        var a20 = a * 20;
        var b20 = b * 20;
        var i;
        for (i = 0; i < 20; i++) {
            if (hashes[a20 + i] < hashes[b20 + i]) {
                return -1;
            } else if (hashes[a20 + i] > hashes[b20 + i]) {
                return 1
            }
        }
        return 0;
    });

    var sortedHashes = new Uint8Array(20 * numFiles);
    var sortedOffsets = new Uint32Array(numFiles);
    for (i = 0; i < numFiles; i++) {
        var i20 = i * 20;
        var target = sortTargets[i];
        var target20 = target * 20;
        var j;
        for (j = 0; j < 20; j++) {
            sortedHashes[i20 + j] = hashes[target20 + j];
        }
        sortedOffsets[i] = offsets[target];
    }

    var fanout = new Uint32Array(256);

    var j = 0;
    var count = 0;
    for (i = 0; i < 256; i++) {
        while (sortedHashes[j] === i) {
            count++;
            j += 20;
        }
        fanout[i] = count;
    }

    return {
        pack: pack,
        fanout: fanout,
        hashes: sortedHashes,
        offsets: sortedOffsets,
    };
};

var nullFile = new Uint8Array(0);

PackIndex.lookupFile = function (index, hash, hashOffset) {
    var firstByte = hash[hashOffset];
    if (firstByte === 0) {
        var low = 0;
    } else {
        var low = index.fanout[firstByte - 1];
    }
    var high = index.fanout[firstByte] - 1;

    search:
    while (low <= high) {
        var mid = (low + high) >>> 1;
        var mid20 = mid * 20;
        var i;
        for (i = 1; i < 20; i++) {
            if (hash[hashOffset + i] > index.hashes[mid20 + i]) {
                low = mid + 1;
                continue search;
            } else if (hash[hashOffset + i] < index.hashes[mid20 + i]) {
                high = mid - 1;
                continue search;
            }
        }

        var offset = index.offsets[mid];
        var file = nullFile;
        var ex = Pack.extractFile(index.pack, offset, file, 0);
        file = new Uint8Array(ex[1]);
        Pack.extractFile(index.pack, offset, file, 0);
        return file;
    }
    return null;
};

})();