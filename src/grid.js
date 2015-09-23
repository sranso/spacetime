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

Grid.noCells = [];
Grid.noAreas = [];

Grid.insertRowAfter = function (grid, r) {
    for (var c = 0; c < grid.cells.length; c++) {
        var column = grid.cells[c];
        var cell = Cell.deepCopy(Library.empty);
        column.splice(r + 1, 0, cell);
    }
    grid.areas.forEach(function (area) {
        if (area.coords[3] >= r) {
            area.coords[3]++;
        }
        if (area.coords[1] > r) {
            area.coords[1]++;
        }
    });
};

})();
