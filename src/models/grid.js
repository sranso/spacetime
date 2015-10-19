'use strict';
var Grid = {};
(function () {

Grid.create = function () {
    return {
        layer: Grid.over,
        numFrames: 0,
        cells: [], // TODO: make this Grid.noCells,
        areas: [], // TODO: make this Grid.noAreas,
    };
};

Grid.over = {_: 'over'};
Grid.under = {_: 'under'};
Grid.noneLayer = {_: 'none'};

Grid.none = Grid.create();
Grid.none.layer = Grid.noneLayer;
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

Grid.deleteColumnsAfter = function (grid, c) {
    var toDelete = grid.cells.length - c;
    grid.cells.splice(c, toDelete);
    grid.areas = grid.areas.filter(function (area) {
        if (area.coords[0] >= c) {
            return false;
        }
        if (area.coords[2] >= c) {
            area.coords[2] = c - 1;
        }
        return true;
    });
};

Grid.columnForFrame = function (grid, frame) {
    var r = grid.cells[0].length - 1;

    var cell, numFrames;
    for (var c = 0; c < grid.cells.length; c++) {
        cell = grid.cells[c][r];
        numFrames = Cell.numFrames(cell);
        if (numFrames > frame) {
            break;
        }
        frame -= numFrames;
    }

    return {
        c: c,
        cell: cell,
        frame: frame,
        numFrames: numFrames,
        frameFraction: frame / numFrames,
    };
};

Grid.frameForColumn = function (grid, column) {
    var r = grid.cells[0].length - 1;

    var cell;
    var frame = 0;
    for (var c = 0; c <= column; c++) {
        cell = grid.cells[c][r];
        if (c < column) {
            frame += Cell.numFrames(cell);
        }
    }

    return {
        cell: cell,
        startFrame: frame,
    };
};

})();
