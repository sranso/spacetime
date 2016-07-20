'use strict';
(function () {

var newPointers = new Uint32Array(4);

global.take = function (array, numToTake) {
    var pointer32 = array >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    var level = $mold.data8[mold8 + Mold.data8_arrayTreeLevel];
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];

    if (level > 0) {
        var perLeftChildCount = 1 << (2 * level);
        var childIndex = ((numToTake - 1) >> (2 * level)) & 0x3;
        var leftCount = perLeftChildCount * childIndex;
        var child = $table.data32[pointer32 + childIndex];
        var childTake = take(child, numToTake - leftCount);

        if (childIndex === 0) {
            return childTake;
        }

        var i;
        for (i = 0; i < childIndex; i++) {
            newPointers[i] = $table.data32[pointer32 + i];
        }
        newPointers[childIndex] = childTake;
        moldIndex = ArrayTree.moldIndexFor(level, childIndex + 1, ArrayTree.treeType);

    } else {

        if (numChildren === 0) {
            var elementType = ArrayTree.treeType;
        } else {
            var element = $table.data32[pointer32];
            var elementType = $table.data8[Table.typeOffset(element)] & Type.mask;
            if (elementType === Type.tree) {
                elementType = ArrayTree.treeType;
            } else {
                elementType = ArrayTree.blobType;
            }
        }

        var i;
        for (i = 0; i < numToTake; i++) {
            newPointers[i] = $table.data32[pointer32 + i];
        }
        moldIndex = ArrayTree.moldIndexFor(level, numToTake, elementType);
    }

    return ApiSet._create(moldIndex, newPointers);
};

})();
