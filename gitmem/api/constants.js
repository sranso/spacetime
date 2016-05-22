'use strict';
global.Constants = {};
(function () {

Constants.initialize = function () {
    Constants.emptyString = hash('');
    Constants.zero = hash(0);
    Constants.one = hash(1);

    Constants.emptyTree = createZero({
        '.empty': Constants.emptyString,
    });
    var pointer32 = Constants.emptyTree >> 2;
    var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
    $mold.data8[moldIndex * Mold.data8_size + Mold.data8_numChildren] = 0;
};

})();
