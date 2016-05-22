'use strict';
global.Constants = {};
(function () {

Constants.initialize = function (minNumber, maxNumber) {
    Constants.emptyString = hash('');

    Constants.emptyTree = createZero({
        '.empty': Constants.emptyString,
    });
    var pointer32 = Constants.emptyTree >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    $mold.data8[moldIndex * Mold.data8_size + Mold.data8_numChildren] = 0;

    Constants.positive = new Uint32Array(maxNumber + 1);
    Constants.negative = new Uint32Array(-minNumber + 1);
    var i;
    for (i = 0; i <= maxNumber; i++) {
        Constants.positive[i] = hash(i);
    }
    for (i = 0; i >= minNumber; i--) {
        Constants.negative[-i] = hash(i);
    }
};

})();
