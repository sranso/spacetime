'use strict';
var View = {};
(function () {

View.selectCell = function (d) {
    Global.targetCellView = d;
    Global.targetCellArg = 0;
    Draw.draw();
};

var deselectCellWithoutDraw = function () {
    Global.targetCellView = null;
};

View.deselectCell = function () {
    deselectCellWithoutDraw();
    Draw.draw();
};

View.changeCellArgs = function (d) {
    var t = Global.targetCellView;
    if (!t) {
        return;
    }
    var argIndex = Cell.argIndex(t.cell, t.c, t.r, d.c, d.r);
    if (argIndex === -1) {
        Cell.pointToArg(t.cell, t.c, t.r, Global.targetCellArg, d.c, d.r);
        Main.update();
    } else {
        Global.targetCellArg = argIndex;
    }
};

View.openCell = function (d) {
    Project.openCell($Project, d.cell, d.c, d.r);
    Global.targetCellView = null;
    Main.update();
};

View.outLevel = function () {
    Project.outLevel($Project);
    Main.update();
};

View.intoLevel = function () {
    Project.intoLevel($Project);
    Main.update();
};

View.inputText = function (d, text) {
    Global.targetCellView = d;
    d.cell.text = text;
    var grid = Project.currentGrid($Project);
    var cell = Autocomplete.updateFromText(grid, d.cell, d.c, d.r);
    Global.targetCellView.cell = cell;
    Main.update();
};

View.insertRow = function (d, after) {
    Global.targetCellView = d;
    if (!d) {
        return;
    }
    var grid = Project.currentGrid($Project);
    Grid.insertRow(grid, d.r, after);
    if (after) {
        d.r++;
    }
    d.cell = grid.cells[d.c][d.r];
    Main.update();
    if (Global.inputCell) {
        var cellEl = Global.cellEls[d.c][d.r];
        d3.select(cellEl).select('.text').node().focus();
    }
};

View.insertColumn = function (d, after) {
    Global.targetCellView = d;
    if (!d) {
        return;
    }
    var grid = Project.currentGrid($Project);
    Grid.insertColumn(grid, d.c, after);
    if (after) {
        d.c++;
    }
    d.cell = grid.cells[d.c][d.r];
    Main.update();
    if (Global.inputCell) {
        var cellEl = Global.cellEls[d.c][d.r];
        d3.select(cellEl).select('.text').node().focus();
    }
};

View.deleteCell = function (d, deleteColumn) {
    Global.targetCellView = d;
    if (!d) {
        return;
    }
    var grid = Project.currentGrid($Project);
    if (deleteColumn) {
        Grid.deleteColumn(grid, d.c);
        d.c--;
        if (d.c < 0) {
            d.c = 0;
        }
    } else {
        Grid.deleteRow(grid, d.r);
        d.r--;
        if (d.r < 0) {
            d.r = 0;
        }
    }
    d.cell = grid.cells[d.c][d.r];
    Main.update();
    if (Global.inputCell) {
        var cellEl = Global.cellEls[d.c][d.r];
        d3.select(cellEl).select('.text').node().focus();
    }
};

View.showFrame = function (d, x) {
    x = Math.max(0, Math.min(159, x));
    var numFrames = Cell.numFrames(d.cell);
    var fetchFrame = Math.floor(numFrames * x / 160);
    var grid = Project.currentGrid($Project);
    Execute.executeCell(grid, d.cell, fetchFrame, d.c, d.r);
    Draw.draw();
};

})();
