'use strict';
global.ArrayTree = {};
(function () {

ArrayTree.blobType = 0;
ArrayTree.treeType = 5;  // 5 because tree types start at $zeros[5]

ArrayTree.initialize = function (levels) {
    ArrayTree.$zeros = new Uint32Array(3 * levels + 2 + ArrayTree.treeType);

    // Empty array tree
    var emptyArrayTree = createZero({
        '.empty-array:L0': $[Constants.emptyString],
    });
    $table.data8[Table.typeOffset(emptyArrayTree)] = Type.arrayTree;
    var pointer32 = emptyArrayTree >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    var mold8 = moldIndex * Mold.data8_size;
    $mold.data8[mold8 + Mold.data8_treeType] = Type.arrayTree;
    $mold.data8[mold8 + Mold.data8_numChildren] = 0;
    $mold.data8[mold8 + Mold.data8_arrayTreeLevel] = 0;
    ArrayTree.$zeros[0 + ArrayTree.blobType] = emptyArrayTree;
    ArrayTree.$zeros[0 + ArrayTree.treeType] = emptyArrayTree;

    var fullLowerLevel = writeLevel(0, 1, Constants.$positive[0], ArrayTree.blobType);
    writeLevel(0, 1, $[Constants.emptyTree], ArrayTree.treeType);

    var level;
    for (level = 1; level < levels; level++) {
        fullLowerLevel = writeLevel(level, 2, fullLowerLevel, ArrayTree.treeType);
    };
};

var writeLevel = function (level, startNumChildren, fullLowerLevel, arrayType) {
    var zero;
    var config = {};
    config['0:L' + level] = fullLowerLevel;
    if (startNumChildren === 2) {
        config['1'] = fullLowerLevel;
    }
    var numChildren;
    for (numChildren = startNumChildren; numChildren <= 4; numChildren++) {
        zero = createZero(config);
        ArrayTree.$zeros[3 * level + numChildren + arrayType] = zero;
        $table.data8[Table.typeOffset(zero)] = Type.arrayTree;
        var pointer32 = zero >> 2;
        var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
        var mold8 = moldIndex * Mold.data8_size;
        $mold.data8[mold8 + Mold.data8_treeType] = Type.arrayTree;
        $mold.data8[mold8 + Mold.data8_numChildren] = numChildren;
        $mold.data8[mold8 + Mold.data8_arrayTreeLevel] = level;

        config['' + numChildren] = fullLowerLevel;
    }
    return zero;
};

ArrayTree.moldIndexFor = function (level, numChildren, type) {
    var zero = ArrayTree.$zeros[3 * level + numChildren + type];
    return $table.data32[(zero >> 2) + Table.data32_moldIndex];
};

})();
