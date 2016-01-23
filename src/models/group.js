'use strict';
global.Group = {};
(function () {

Group.create = function () {
    return {
        grids: [],       // [list of grids containing areas in group]
        color: [_.random(360), _.random(70, 95), _.random(58, 63)],
        remember: false,
    };
};

Group.none = Group.create();

})();
