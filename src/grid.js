'use strict';
var Grid = {};
(function () {

Grid.create = function () {
    return {
        layer: 'over',
        numFrames: 0,
        cells: [], // TODO: make this Grid.noCells,
        areas: [], // TODO: make this Grid.noAreas,
    };
};

Grid.none = Grid.create();
Grid.none.layer = 'none';
Grid.none.numFrames = 1;

Grid.cellAt = function (grid, c, r) {
    if (c < 0 || c >= grid.cells.length) {
        return Cell.none;
    } else if (r < 0 || r >= grid.cells[0].length) {
        return Cell.none;
    } else {
        return grid.cells[c][r];
    }
};

Grid.noCells = [];
Grid.noAreas = [];

})();