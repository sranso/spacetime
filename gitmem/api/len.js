'use strict';
(function () {

global.len = function (pointer) {
    var pointer32 = pointer >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    var level = $mold.data8[mold8 + Mold.data8_arrayTreeLevel];
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];
    if (level === 0) {
        return numChildren;
    }

    var lastChild = $table.data32[pointer32 + numChildren - 1];
    return (1 << (2 * level)) * (numChildren - 1) + len(lastChild);
};

})();
