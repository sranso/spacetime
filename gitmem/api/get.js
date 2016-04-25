'use strict';
(function () {

global.get = function (hashOffset, childIndex) {
    var dataOffset = hashOffset >> 2;
    return $hashTable.data32[dataOffset + childIndex];
};

})();
