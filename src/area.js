'use strict';
var Area = {};
(function () {

Area.create = function () {
    return {
        group: Group.none,
        coords: [],   // [c1, r1, c2, r2] where c/r1 is top left
        text: '',
    };
};

Area.none = Area.create();

})();
