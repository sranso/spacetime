'use strict';
(function () {

global.getAt = function (array, index) {
    var pointer32 = array >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    var level = $mold.data8[mold8 + Mold.data8_arrayTreeLevel];
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];
    var leftCount = (1 << (2 * level)) * (numChildren - 1);

    if (index < leftCount || level === 0) {
        while (level > 0) {
            var childIndex = (index >> (2 * level)) & 0x3;
            pointer32 = $table.data32[pointer32 + childIndex] >> 2;
            level--;
        }
        return $table.data32[pointer32 + (index & 0x3)];
    }

    var rightChild = $table.data32[pointer32 + numChildren - 1];
    return getAt(rightChild, index - leftCount);
};

})();
