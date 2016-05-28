'use strict';
global.ArrayTree = {};
(function () {

ArrayTree.blobType = 0;
ArrayTree.treeType = 1;

ArrayTree.initialize = function (levels) {
    var zeros = new Uint32Array(6 * levels + 4);
    ArrayTree.$zeros = zeros;

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
    zeros[0] = emptyArrayTree;
    zeros[1] = emptyArrayTree;

    // The rest of blob zeros and tree levels >= 1
    var fullLowerLevel = Constants.$positive[0];
    var i;
    var level;
    var numChildren = 1;
    for (level = 0; level < levels; level++) {
        var j;
        while (numChildren <= 4) {
            j = 6 * level + 2 * numChildren;

            var config = {};
            config['0:L' + level] = fullLowerLevel;
            for (i = 1; i < numChildren; i++) {
                config['' + i] = fullLowerLevel;
            }
            zeros[j] = createZero(config);
            zeros[j + 1] = zeros[j];
            $table.data8[Table.typeOffset(zeros[j])] = Type.arrayTree;
            var pointer32 = zeros[j] >> 2;
            var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
            var mold8 = moldIndex * Mold.data8_size;
            $mold.data8[mold8 + Mold.data8_treeType] = Type.arrayTree;
            $mold.data8[mold8 + Mold.data8_numChildren] = numChildren;
            $mold.data8[mold8 + Mold.data8_arrayTreeLevel] = level;
            numChildren++;
        }

        fullLowerLevel = zeros[j];
        numChildren = 2;
    }

    // treeZeros level 0
    var emptyTree = $[Constants.emptyTree];
    var config = {};
    config['0:L0'] = emptyTree;
    for (numChildren = 1; numChildren <= 4; numChildren++) {
        var zero = createZero(config);
        zeros[2 * numChildren + ArrayTree.treeType] = zero;
        $table.data8[Table.typeOffset(zero)] = Type.arrayTree;
        var pointer32 = zero >> 2;
        var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
        var mold8 = moldIndex * Mold.data8_size;
        $mold.data8[mold8 + Mold.data8_treeType] = Type.arrayTree;
        $mold.data8[mold8 + Mold.data8_numChildren] = numChildren;
        $mold.data8[mold8 + Mold.data8_arrayTreeLevel] = 0;

        config[numChildren] = emptyTree;
    }
};

ArrayTree.zeroFor = function (level, numChildren, type) {
    return ArrayTree.$zeros[6 * level + 2 * numChildren + type];
};

})();
