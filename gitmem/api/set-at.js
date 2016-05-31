'use strict';
(function () {

var newPointers = new Uint32Array(4);

global.setAt = function (array, index, element) {
    var pointer32 = array >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    var level = $mold.data8[mold8 + Mold.data8_arrayTreeLevel];
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];

    if (level > 0) {
        var perLeftChildCount = 1 << (2 * level);
        var childIndex = (index >> (2 * level)) & 0x3;
        var leftCount = perLeftChildCount * childIndex;
        var child = $table.data32[pointer32 + childIndex];
        var newChild = setAt(child, index - leftCount, element);
    } else {
        var childIndex = index;
        var newChild = element;
    }

    var i;
    for (i = 0; i < numChildren; i++) {
        newPointers[i] = $table.data32[pointer32 + i];
    }
    newPointers[childIndex] = newChild;

    return ApiSet._create(moldIndex, newPointers);
};

})();
