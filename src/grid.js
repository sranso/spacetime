'use strict';
var Grid = {};
(function () {

Grid.create = function () {
    return {
        layer: 'over',
        cells: [],
        areas: [],
    };
};

Grid.none = Grid.create();
Grid.none.layer = 'none';

Grid.cellAt = function (grid, c, r) {
    if (c < 0 || c >= grid.cells.length) {
        return Cell.none;
    } else if (r < 0 || r >= grid.cells[0].length) {
        return Cell.none;
    } else {
        return grid.cells[c][r];
    }
};

})();
