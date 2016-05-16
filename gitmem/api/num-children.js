'use strict';
(function () {

global.numChildren = function (pointer) {
    var pointer32 = pointer >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    return $mold.data8[moldIndex * Mold.data8_size + Mold.data8_numChildren];
};

})();
