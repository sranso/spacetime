'use strict';
(function () {

var newPointers = new Uint32Array(4 * 25); // 25 is > max levels

global.deleteAt = function (array, deleteIndex, pushElement) {
    return _deleteAtAndPush(array, deleteIndex, pushElement, 0);
};
global.deleteAtAndPush = deleteAt;

var _deleteAtAndPush = function (array, deleteIndex, pushElement, newPointersIndex) {
    var pointer32 = array >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    var level = $mold.data8[mold8 + Mold.data8_arrayTreeLevel];
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];

    if (level > 0) {
        var perLeftChildCount = 1 << (2 * level);
        var childIndex = (deleteIndex >> (2 * level)) & 0x3;
        var leftCount = perLeftChildCount * childIndex;

        var i;
        for (i = 0; i < childIndex; i++) {
            newPointers[newPointersIndex + i] = $table.data32[pointer32 + i];
        }

        var child = $table.data32[pointer32 + childIndex];
        var newChild;
        deleteIndex -= leftCount;
        while (childIndex < numChildren) {
            var shiftFrom = childIndex + 1;
            if (shiftFrom < numChildren) {
                var shiftChild = $table.data32[pointer32 + shiftFrom];
                var shiftElement = getAt(shiftChild, 0);
            } else if (pushElement) {
                var shiftElement = pushElement;
            } else {
                var shiftElement = null;
            }

            newChild = _deleteAtAndPush(child, deleteIndex, shiftElement, newPointersIndex + 4);
            newPointers[newPointersIndex + childIndex] = newChild;

            deleteIndex = 0;
            child = shiftChild;
            childIndex++;
        }

        if (newChild === ArrayTree.$zeros[0]) {
            numChildren--;
            if (numChildren === 0) {
                return newChild;
            } else if (numChildren === 1) {
                return newPointers[newPointersIndex + 0];
            } else {
                moldIndex = ArrayTree.moldIndexFor(level, numChildren, ArrayTree.treeType);
            }
        }

    } else {
        var element = $table.data32[pointer32];
        var elementType = $table.data8[Table.typeOffset(element)];
        if (elementType === Type.tree) {
            elementType = ArrayTree.treeType;
        } else {
            elementType = ArrayTree.blobType;
        }

        var i;
        for (i = 0; i < deleteIndex; i++) {
            newPointers[newPointersIndex + i] = $table.data32[pointer32 + i];
        }
        for (i = deleteIndex + 1; i < numChildren; i++) {
            newPointers[newPointersIndex + i - 1] = $table.data32[pointer32 + i];
        }

        if (pushElement) {
            newPointers[newPointersIndex + numChildren - 1] = pushElement;
        } else {
            numChildren--;
        }
        var moldIndex = ArrayTree.moldIndexFor(level, numChildren, elementType);
    }

    return ApiSet._create(moldIndex, newPointers.subarray(newPointersIndex, newPointersIndex + 4));
};

})();
