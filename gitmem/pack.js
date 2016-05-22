'use strict';
global.Pack = {};
(function () {

var packOffset = 0;
var numFiles = 0;

Pack.create = function (commitPointer) {
    $pack[0] = 'P'.charCodeAt(0);
    $pack[1] = 'A'.charCodeAt(0);
    $pack[2] = 'C'.charCodeAt(0);
    $pack[3] = 'K'.charCodeAt(0);

    $pack[4] = 0;
    $pack[5] = 0;
    $pack[6] = 0;
    $pack[7] = 2;

    packOffset = 12;
    numFiles = 0;
    packSingle(commitPointer);

    $pack[8]  =  numFiles >>> 24;
    $pack[9]  = (numFiles >>> 16) & 0xff;
    $pack[10] = (numFiles >>>  8) & 0xff;
    $pack[11] =  numFiles         & 0xff;

    Sha1.hash($pack, 0, packOffset, $pack, packOffset);

    return packOffset + 20;
};

var packSingle = function (pointer) {
    var typeOffset = Table.typeOffset(pointer);
    var type = $table.data8[typeOffset];
    if (type & Type.onServer) {
        return;
    }

    $table.data8[typeOffset] = type | Type.onServer;
    numFiles++;
    var pointer32 = pointer >> 2;

    type &= Type.mask;
    if (type === Type.tree) {

        // Pack tree

        var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
        var mold8 = moldIndex * Mold.data8_size;
        var numHoles = $mold.data8[mold8 + Mold.data8_numHoles];

        // Write to mold
        var mold32 = moldIndex * Mold.data32_size;
        var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
        var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
        Mold.fillHoles($mold, moldIndex, $table.data32, pointer32);

        // Pack and recurse
        packOffset = PackData.packFile(packOffset, $mold.fileArray, fileStart, fileEnd);
        var i;
        for (i = 0; i < numHoles; i++) {
            packSingle($table.data32[pointer32 + i]);
        }

    } else if (type === Type.commit) {

        // Pack commit
        var fileLength = CommitFile.create($table.data32, pointer32);
        packOffset = PackData.packFile(packOffset, $file, 0, fileLength);
        packSingle($table.data32[pointer32 + Commit.tree]);
        var parent = $table.data32[pointer32 + Commit.parent];
        if (parent) {
            packSingle(parent);
        }

    } else {

        // Pack blob

        var value = val(pointer);
        if (type === Type.string || type === Type.longString) {
            var fileLength = Blob.create('"' + value);
        } else {
            var fileLength = Blob.create('' + value);
        }
        packOffset = PackData.packFile(packOffset, $file, 0, fileLength);
    }
}

var tempHash = new Uint8Array(20);

Pack.validate = function (pack) {
    if (pack.length < 22) {
        return 'Pack length is too short';
    }

    if (
        pack[0] !== 'P'.charCodeAt(0) ||
        pack[1] !== 'A'.charCodeAt(0) ||
        pack[2] !== 'C'.charCodeAt(0) ||
        pack[3] !== 'K'.charCodeAt(0)
    ) {
        return 'Incorrect pack prefix';
    }

    if (pack[7] !== 2) {
        return 'Unsupported pack version number (not 2)';
    }

    var j = pack.length - 20;
    Sha1.hash(pack, 0, j, tempHash, 0);

    var i;
    for (i = 0; i < 20; i++) {
        if (pack[j + i] !== tempHash[i]) {
            return 'Incorrect pack hash';
        }
    }

    return null;
};

})();
