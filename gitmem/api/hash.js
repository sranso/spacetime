'use strict';
(function () {

var fileRange = new Uint32Array(2);
var tempHash = new Uint8Array(20);

global.hash = function (value) {
    var blobLength;
    var type;
    switch (typeof value) {
    case 'string':
        blobLength = Blob.create($file, '"' + value);
        if (value.length > Table.dataLongStrings_maxLength) {
            throw new Error('String too long: ' + value.length);
        } else if (value.length > Table.data8_stringLength) {
            type = Type.longString;
        } else {
            type = Type.string;
        }
        break;
    case 'number':
        blobLength = Blob.create($file, '' + value);
        if (value === (value | 0)) {
            type = Type.integer;
        } else {
            type = Type.float;
        }
        break;
    default:
        throw new Error('Unsupported type: ' + (typeof value));
    }

    Sha1.hash($file, 0, blobLength, tempHash, 0);
    var pointer = Table.findPointer($table, tempHash, 0);

    if (pointer > 0) {
        return pointer;
    }

    pointer = ~pointer;
    Table.setHash($table, pointer, tempHash, 0);
    $table.data8[Table.typeOffset(pointer)] = type;

    switch (type) {
    case Type.string:
        $table.data8[pointer + Table.data8_stringLength] = value.length;
        var i;
        for (i = 0; i < value.length; i++) {
            $table.data8[pointer + i] = value.charCodeAt(i);
        }
        break;
    case Type.longString:
        $table.data8[pointer + Table.data8_stringLength] = value.length;
        $table.data32[pointer >> 2] = $table.dataLongStrings.length;
        $table.dataLongStrings.push(value);
        break;
    case Type.integer:
        $table.dataInt32[pointer >> 2] = value;
        break;
    case Type.float:
        $table.dataFloat64[(pointer + 4) >> 3] = value;
        break;
    }

    return pointer;
};

})();
