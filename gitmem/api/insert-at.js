'use strict';
(function () {

var newPointers = new Uint32Array(4 * 25); // 25 is > max levels

global.insertAt = function (array, insertIndex, element, pop) {
    var elementType = $table.data8[Table.typeOffset(element)];
    if (elementType === Type.tree) {
        elementType = ArrayTree.treeType;
    } else {
        elementType = ArrayTree.blobType;
    }

    var maxLevel = pop ? -1 : 1000000;
    return _insertAtAndPop(array, insertIndex, element, elementType, maxLevel, 0);
};
global.insertAtAndPop = insertAt;

var poppedElement = -1;

var _insertAtAndPop = function (array, insertIndex, element, elementType, maxLevel, newPointersIndex) {
    var pointer32 = array >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    var level = $mold.data8[mold8 + Mold.data8_arrayTreeLevel];
    var numChildren = $mold.data8[mold8 + Mold.data8_numChildren];

    var lastChildIndex = numChildren - 1;
    var makeSpace = false;
    var pop = maxLevel === -1;

    if (level === 0) {
        var arrayType = elementType;
        var childIndex = insertIndex;

        lastChildIndex++;
        var pop = pop || lastChildIndex === 4 && maxLevel === 0;
        makeSpace = lastChildIndex === 4 && !pop;

        var i;
        for (i = 0; i < insertIndex; i++) {
            newPointers[newPointersIndex + i] = $table.data32[pointer32 + i];
        }

        newPointers[newPointersIndex + insertIndex] = element;

        if (pop) {
            var endChild = numChildren - 2;
        } else {
            var endChild = numChildren - 1;
        }

        for (i = insertIndex; i <= endChild; i++) {
            newPointers[newPointersIndex + i + 1] = $table.data32[pointer32 + i];
        }

        if (insertIndex < 4) {
            poppedElement = $table.data32[pointer32 + numChildren - 1];
        } else {
            poppedElement = element;
        }
    } else {
        var arrayType = ArrayTree.treeType;
        var perLeftChildCount = 1 << (2 * level);
        var childIndex = insertIndex >> (2 * level);

        var i;
        for (i = 0; i < childIndex; i++) {
            newPointers[newPointersIndex + i] = $table.data32[pointer32 + i];
        }

        if (childIndex >= numChildren) {
            makeSpace = true;
            poppedElement = element;
            lastChildIndex++;
        } else {
            var shiftElement = element;
            var leftCount = perLeftChildCount * childIndex;
            var childInsertIndex = insertIndex - leftCount;
            for (i = childIndex; i < lastChildIndex; i++) {
                var child = $table.data32[pointer32 + i];
                var newChild = _insertAtAndPop(child, childInsertIndex, shiftElement, elementType, -1, newPointersIndex + 4);
                newPointers[newPointersIndex + i] = newChild;
                shiftElement = poppedElement;
                childInsertIndex = 0;
            }

            var child = $table.data32[pointer32 + i];
            if (pop) {
                var childMaxLevel = -1;
            } else {
                var childMaxLevel = level - 1;
            }

            var newChild = _insertAtAndPop(child, childInsertIndex, shiftElement, elementType, childMaxLevel, newPointersIndex + 4);
            if (newChild < 0) {
                newChild = -newChild;
                lastChildIndex++;
                makeSpace = true;
            }
            newPointers[newPointersIndex + i] = newChild;
        }
    }

    var full = lastChildIndex === 4 && level === maxLevel;
    if (full || pop) {
        var newArray = ApiSet._create(moldIndex, newPointers.subarray(newPointersIndex, newPointersIndex + 4));
        if (full) {
            return -newArray;
        } else {
            return newArray;
        }
    }

    if (makeSpace) {
        var lastChildMoldIndex = ArrayTree.moldIndexFor(0, 1, elementType);
        newPointers[newPointersIndex + 4] = poppedElement;
        var newLastChild = ApiSet._create(lastChildMoldIndex, newPointers.subarray(newPointersIndex + 4, newPointersIndex + 8));
    }

    if (lastChildIndex === 4) {
        var newArray = ApiSet._create(moldIndex, newPointers.subarray(newPointersIndex, newPointersIndex + 4));
        newPointers[newPointersIndex + 0] = newArray;
        newPointers[newPointersIndex + 1] = newLastChild;
        moldIndex = ArrayTree.moldIndexFor(level + 1, 2, ArrayTree.treeType);
        return ApiSet._create(moldIndex, newPointers.subarray(newPointersIndex, newPointersIndex + 4));
    }

    if (lastChildIndex === numChildren) {
        if (makeSpace) {
            newPointers[newPointersIndex + lastChildIndex] = newLastChild;
        }
        numChildren++;
        moldIndex = ArrayTree.moldIndexFor(level, numChildren, arrayType);
    }

    return ApiSet._create(moldIndex, newPointers.subarray(newPointersIndex, newPointersIndex + 4));
};

})();
