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

Grid.insertRow = function (grid, r, after) {
    for (var c = 0; c < grid.cells.length; c++) {
        var column = grid.cells[c];
        var cell = Cell.deepCopy(Library.empty);
        column.splice(r + (+after), 0, cell);
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

Grid.insertColumn = function (grid, c, after) {
    var column = grid.cells[c].slice();
    for (var r = 0; r < column.length; r++) {
        column[r] = Cell.deepCopy(column[r]);
    }
    grid.cells.splice(c + (+after), 0, column);
    grid.areas.forEach(function (area) {
        if (area.coords[2] >= c) {
            area.coords[2]++;
        }
        if (area.coords[0] > c) {
            area.coords[0]++;
        }
    });
};

Grid.deleteRow = function (grid, r) {
    for (var c = 0; c < grid.cells.length; c++) {
        grid.cells[c].splice(r, 1);
    }
    grid.areas = grid.areas.filter(function (area) {
        if (area.coords[3] >= r) {
            area.coords[3]--;
        }
        if (area.coords[1] > r) {
            area.coords[1]--;
        }
        return area.coords[3] >= area.coords[1];
    });
};

Grid.deleteColumn = function (grid, c) {
    grid.cells.splice(c, 1);
    grid.areas = grid.areas.filter(function (area) {
        if (area.coords[2] >= c) {
            area.coords[2]--;
        }
        if (area.coords[0] > c) {
            area.coords[0]--;
        }
        return area.coords[2] >= area.coords[0];
    });
};


})();
