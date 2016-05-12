'use strict';
(function () {

global.get = function (pointer, childIndex) {
    var pointer32 = pointer >> 2;
    return $table.data32[pointer32 + childIndex];
};

})();
