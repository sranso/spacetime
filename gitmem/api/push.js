'use strict';
(function () {

var newPointers = new Uint32Array(4);
var tempHash = new Uint8Array(20);

global.push = function (array, element) {
    var elementType = $table.data8[Table.typeOffset(element)];
    if (elementType === Type.tree) {
        elementType = ArrayTree.treeType;
    } else {
        elementType = ArrayTree.blobType;
    }

    return pushChild(array, element, elementType, 1000000);
};

var pushChild = function (array, element, elementType, maxLevel) {
    var pointer32 = array >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    var level = $mold.data8[mold8 + Mold.data8_arrayTreeLevel];
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];

    var lastChildIndex = numChildren - 1;
    if (level === 0) {
        var arrayType = elementType;
        var newLastChild = numChildren < 4 ? element : 0;
        lastChildIndex++;
    } else {
        var arrayType = ArrayTree.treeType;
        var lastChild = $table.data32[pointer32 + lastChildIndex];
        var newLastChild = pushChild(lastChild, element, elementType, level - 1);
        if (newLastChild === 0) {
            lastChildIndex++;
        }
    }

    if (lastChildIndex === 4 && level === maxLevel) {
        return 0; // full
    }

    if (newLastChild === 0) {
        var lastChildMoldIndex = ArrayTree.moldIndexFor(0, 1, elementType);
        newPointers[0] = element;
        newLastChild = ApiSet._create(lastChildMoldIndex, newPointers);
    }

    if (lastChildIndex === 4) {
        level++;
        var moldIndex = ArrayTree.moldIndexFor(level, 2, ArrayTree.treeType);
        newPointers[0] = array;
        newPointers[1] = newLastChild;
        return ApiSet._create(moldIndex, newPointers);
    }

    var i;
    for (i = 0; i < numChildren; i++) {
        newPointers[i] = $table.data32[pointer32 + i];
    }
    newPointers[lastChildIndex] = newLastChild;

    if (lastChildIndex === numChildren) {
        numChildren++;
        moldIndex = ArrayTree.moldIndexFor(level, numChildren, arrayType);
    }

    return ApiSet._create(moldIndex, newPointers);
};

})();
