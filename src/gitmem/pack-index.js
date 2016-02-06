'use strict';
global.PackIndex = {};
(function () {

var fileForCreate = new Uint8Array(65536);

PackIndex.create = function (pack) {
    var packContentsEnd = pack.length - 20;

    var numFiles = (pack[8] << 24) | (pack[9] << 16) | (pack[10] << 8) | pack[11];
    var hashes = new Uint8Array(20 * numFiles);
    var offsets = new Uint32Array(numFiles);

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
        j = ex[0];
        k = ex[1];
        hashOffset += 20;
    }

    PackIndex._sortHashes(hashes, offsets, 0, numFiles - 1);
    return hashes;
};

PackIndex._sortHashes = function (hashes, offsets, low, high) {
    var temp;

    if (low < high) {
        var mid = (low + high) >>> 1;
        var low20 = low * 20;
        var mid20 = mid * 20;
        var high20 = high * 20;

        // Choose a pivot by taking the median, and place
        // it at high20.
        if (hashLessThanOrEqual(hashes, low20, high20)) {
            if (hashLessThanOrEqual(hashes, mid20, high20)) {
                swapHashes(hashes, mid20, high20);
                temp = offsets[high];
                offsets[high] = offsets[mid];
                offsets[mid] = temp;
            } else if (hashLessThanOrEqual(hashes, high20, low20)) {
                swapHashes(hashes, low20, high20);
                temp = offsets[high];
                offsets[high] = offsets[low];
                offsets[low] = temp;
            }
        } else {
            if (hashLessThanOrEqual(hashes, low20, high20)) {
                swapHashes(hashes, low20, high20);
                temp = offsets[high];
                offsets[high] = offsets[low];
                offsets[low] = temp;
            } else if (hashLessThanOrEqual(hashes, high20, mid20)) {
                swapHashes(hashes, mid20, high20);
                temp = offsets[high];
                offsets[high] = offsets[mid];
                offsets[mid] = temp;
            }
        }

        var j = low;
        var i20 = low20;
        var i;
        for (i = low; i < high; i++) {
            if (hashLessThanOrEqual(hashes, i20, high20)) {
                swapHashes(hashes, i20, j * 20);
                temp = offsets[j];
                offsets[j] = offsets[i];
                offsets[i] = temp;
                j++;
            }
            i20 += 20;
        }

        swapHashes(hashes, j * 20, high20);
        temp = offsets[high];
        offsets[high] = offsets[j];
        offsets[j] = temp;

        PackIndex._sortHashes(hashes, offsets, low, j - 1);
        PackIndex._sortHashes(hashes, offsets, j + 1, high);
    }
};

var hashLessThanOrEqual = function (hashes, offset1, offset2) {
    var i;
    for (i = 0; i < 20; i++) {
        if (hashes[offset1 + i] < hashes[offset2 + i]) {
            return true;
        } else if (hashes[offset1 + i] > hashes[offset2 + i]) {
            return false;
        }
    }
    return false;
};

var swapHashes = function (hashes, offset1, offset2) {
    var temp;
    var i;
    for (i = 0; i < 20; i++) {
        temp = hashes[offset1 + i];
        hashes[offset1 + i] = hashes[offset2 + i];
        hashes[offset2 + i] = temp;
    }
};

})();
