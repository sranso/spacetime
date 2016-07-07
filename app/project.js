'use strict';
global.Project = {};
(function () {

Project.cell        = 0;
// Project.description = ?;
// Project.name        = ?;

Project.zero = 0;

Project.initialize = function () {
    Project.zero = $.nextIndex++;
    $[Project.zero] = createZero({
        cell: $[Cell.zero],
    });
};

})();
