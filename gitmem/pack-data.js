'use strict';
global.PackData = {};
(function () {

var baseFileArray = new Uint8Array(512);
var deltaData = new Uint8Array(512);

var blobPrefix = Convert.stringToArray('blob ');
var treePrefix = Convert.stringToArray('tree ');
var commitPrefix = Convert.stringToArray('commit ');

var pakoOptions = {level: 6, chunkSize: 4096};
var maxPackHeaderSize = 8;
var packExtraSize = maxPackHeaderSize + 20; // SHA-1 at end of pack

PackData.packFile = function (packOffset, file, fileStart, fileEnd) {
    var contentStart = file.indexOf(0, fileStart + 5) + 1;
    var length = fileEnd - contentStart;

    var typeBits;
    if (file[fileStart] === blobPrefix[0]) {
        typeBits = 0x30;
    } else if (file[fileStart + 1] === treePrefix[1]) {
        typeBits = 0x20;
    } else if (file[fileStart] === commitPrefix[0]) {
        typeBits = 0x10;
    } else {
        throw new Error('Unknown type: ' + file.slice(fileStart, fileStart + 4).join(','));
    }

    var c = typeBits | (length & 0xf);

    length >>>= 4;
    while (length) {
        $pack[packOffset] = c | 0x80;
        c = length & 0x7f;
        length >>>= 7;
        packOffset++;
    }
    $pack[packOffset] = c;
    packOffset++;

    var deflate = new pako.Deflate(pakoOptions);
    deflate.onData = onData;
    deflate.onEnd = onEnd;
    deflate.array = $pack;
    deflate.j = packOffset;
    deflate.push(file.subarray(contentStart, fileEnd), true);

    return deflate.j;
};

var onData = function (chunk) {
    var i;
    for (i = 0; i < chunk.length; i++) {
        this.array[this.j + i] = chunk[i];
    }
    this.j += i;
};

var onEnd = function (status) {
    if (status !== 0) {
        throw new Error(this.strm.msg);
    }
};

PackData.extractFile = function (pack, packOffset, extractFileOutput) {
    var typeBits = pack[packOffset] & 0x70;

    var length = pack[packOffset] & 0xf;
    var shift = 4;
    while (pack[packOffset] & 0x80) {
        packOffset++;
        length |= (pack[packOffset] & 0x7f) << shift;
        shift += 7;
    }
    packOffset++;

    if (typeBits === 0x70) {

        // Delta object

        var deltaDataLength = length;

        var base = Table.findPointer($table, pack, packOffset);
        if (base < 0) {
            throw new Error('Delta base not found');
        }
        packOffset += 20;

        var type = $table.data8[Table.typeOffset(base)] & Type.mask;
        var pointer32 = base >> 2;

        var baseFile = baseFileArray;
        var baseFileStart = 0;
        var prefix;

        // Recreate baseFile

        switch (type) {
        case Type.tree:
            var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
            var mold32 = moldIndex * Mold.data32_size;
            baseFileStart = $mold.data32[mold32 + Mold.data32_fileStart];
            Mold.fillHoles($mold, moldIndex, $table.data32, pointer32);
            baseFile = $mold.fileArray;
            prefix = treePrefix;
            break;

        case Type.commit:
            CommitFile.create(baseFile, $table.data32, pointer32);
            prefix = commitPrefix;
            break;
        case Type.string:
        case Type.string20:
        case Type.longString:
            Blob.create(baseFile, '"' + val(base));
            prefix = blobPrefix;
            break;
        case Type.integer:
        case Type.float:
            Blob.create(baseFile, '' + val(base));
            prefix = blobPrefix;
            break;
        }

        var baseFileContentStart = baseFile.indexOf(0, baseFileStart + 6) + 1;

        // Inflate delta data

        var inflate = new pako.Inflate(pakoOptions);
        inflate.onData = onData;
        inflate.onEnd = onEnd;
        inflate.array = deltaData;
        inflate.j = 0;

        inflate.push(pack.subarray(packOffset), true);

        // Skip base object length
        var delta_j = 0;
        while (deltaData[delta_j] & 0x80) {
            delta_j++;
        }
        delta_j++;

        // Compute resultLength
        var resultLength = deltaData[delta_j] & 0x7f;
        var shift = 0;
        while (deltaData[delta_j] & 0x80) {
            delta_j++;
            shift += 7;
            resultLength |= (deltaData[delta_j] & 0x7f) << shift;
        }
        delta_j++;

        var file_j = writeHeader(prefix, resultLength);

        // Construct file from deltas
        while (delta_j < deltaDataLength) {
            var opcode = deltaData[delta_j];
            delta_j++;

            if (opcode & 0x80) {

                // Copy

                var copyOffset = 0;
                if (opcode & 0x01) {
                    copyOffset = deltaData[delta_j];
                    delta_j++;
                }
                if (opcode & 0x02) {
                    copyOffset |= deltaData[delta_j] << 8;
                    delta_j++;
                }
                copyOffset += baseFileContentStart;

                var copyLength = 0;
                if (opcode & 0x10) {
                    copyLength = deltaData[delta_j];
                    delta_j++;
                }
                if (opcode & 0x20) {
                    copyLength |= deltaData[delta_j] << 8;
                    delta_j++;
                }

                var i;
                for (i = 0; i < copyLength; i++) {
                    $file[file_j + i] = baseFile[copyOffset + i];
                }
                file_j += i;
            } else {

                // Insert

                var i;
                for (i = 0; i < opcode; i++) {
                    $file[file_j + i] = deltaData[delta_j + i];
                }
                file_j += i;
                delta_j += i;
            }
        }

    } else {

        // Full object

        var prefix;
        if (typeBits === 0x30) {
            prefix = blobPrefix;
        } else if (typeBits === 0x20) {
            prefix = treePrefix;
        } else if (typeBits === 0x10) {
            prefix = commitPrefix;
        } else {
            throw new Error('Unknown type: 0x' + typeBits.toString(16));
        }

        var file_j = writeHeader(prefix, length);

        var inflate = new pako.Inflate(pakoOptions);
        inflate.onData = onData;
        inflate.onEnd = onEnd;
        inflate.array = $file;
        inflate.j = file_j;

        inflate.push(pack.subarray(packOffset), true);
        file_j = inflate.j;
    }

    var fileLength = file_j;
    var nextPackOffset = packOffset + inflate.strm.next_in;
    extractFileOutput[0] = fileLength;
    extractFileOutput[1] = nextPackOffset;
};

var writeHeader = function (prefix, length) {
    var lengthString = '' + length;

    var i;
    for (i = 0; i < prefix.length; i++) {
        $file[i] = prefix[i];
    }

    var j = i;
    for (i = 0; i < lengthString.length; i++) {
        $file[j + i] = lengthString.charCodeAt(i);
    }

    j += i;
    $file[j] = 0;

    return j + 1;
};

})();
