'use strict';
(function () {

global.val = function (pointer) {
    var type = $table.data8[Table.typeOffset(pointer)];
    switch (type) {
    case Type.string:
        var length = $table.data8[pointer + Table.data8_stringLength];
        var array = $table.data8.subarray(pointer, pointer + length);
        return String.fromCharCode.apply(null, array);
    case Type.integer:
        return $table.dataInt32[pointer >> 2];
    case Type.float:
        return $table.dataFloat64[(pointer + 4) >> 3];
    default:
        throw new Error('Unknown value type: ' + type);
    }
};

})();
