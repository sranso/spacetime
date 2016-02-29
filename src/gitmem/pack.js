'use strict';
global.Pack = {};
(function () {

Pack.create = function (files) {
    var pack = new Uint8Array(512);
    pack[0] = 'P'.charCodeAt(0);
    pack[1] = 'A'.charCodeAt(0);
    pack[2] = 'C'.charCodeAt(0);
    pack[3] = 'K'.charCodeAt(0);

    pack[4] = 0;
    pack[5] = 0;
    pack[6] = 0;
    pack[7] = 2;

    pack[8] = files.length >>> 24;
    pack[9] = (files.length >>> 16) & 0xff;
    pack[10] = (files.length >>> 8) & 0xff;
    pack[11] = files.length & 0xff;
    var j = 12;

    var f;
    for (f = 0; f < files.length; f++) {
        // Guess that deflated length + header is less than 100
        // bytes over file length (inflated with type header).
        var targetLength = j + files[f].length + 100;
        if (pack.length < targetLength) {
            pack = resizePack(pack, targetLength);
        }

        var jOrNegativeNeededSpace = Pack._packFile(pack, j, files[f]);
        if (jOrNegativeNeededSpace < 0) {
            pack = resizePack(pack, pack.length + -jOrNegativeNeededSpace);
            j = Pack._packFile(pack, j, files[f]);
        } else {
            j = jOrNegativeNeededSpace;
        }
    }

    var remaining = pack.length - j;
    if (remaining < 20) {
        var newPack = new Uint8Array(pack.length + 20 - remaining);
        var i;
        for (i = 0; i < pack.length; i++) {
            newPack[i] = pack[i];
        }
        pack = newPack;
    }

    Sha1.hash(pack.subarray(0, j), pack, j);

    return pack.subarray(0, j + 20);
}

var resizePack = function (pack, targetLength) {
    var newLength = pack.length;
    while (newLength < targetLength) {
        if (newLength < 32768) {
            var newLength = pack.length * 2;
        } else {
            var newLength = 8192 * (((pack.length * 1.5) >>> 13) + 1);
        }
    }

    var newPack = new Uint8Array(newLength);
    var i;
    for (i = 0; i < pack.length; i++) {
        newPack[i] = pack[i];
    }

    return newPack;
}

Pack.validate = function (pack) {
    if (pack.length < 22) {
        return 'pack length is too short';
    }

    if (
        pack[0] !== 'P'.charCodeAt(0) ||
        pack[1] !== 'A'.charCodeAt(0) ||
        pack[2] !== 'C'.charCodeAt(0) ||
        pack[3] !== 'K'.charCodeAt(0)
    ) {
        return 'incorrect pack prefix';
    }

    if (pack[7] !== 2) {
        return 'unsupported pack version number (not 2)';
    }

    var packContent = pack.subarray(0, pack.length - 20);
    var packHashComputed = new Uint8Array(20);
    Sha1.hash(packContent, packHashComputed, 0);

    if (!GitConvert.hashEqual(pack, pack.length - 20, packHashComputed, 0)) {
        return 'incorrect pack hash';
    }

    return null;
};

})();
