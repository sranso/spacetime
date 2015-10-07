'use strict';
var Do = {};
(function () {

Do.selectCell = function (d) {
    Global.targetCellView = d;
    Global.targetCellArg = 0;
    Ui.draw();
};

var deselectCellWithoutDraw = function () {
    Global.targetCellView = null;
};

Do.deselectCell = function () {
    deselectCellWithoutDraw();
    Ui.draw();
};

Do.changeCellArgs = function (d) {
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

Do.openCell = function (d) {
    Project.openCell($Project, d.cell, d.grid, d.c, d.r);
    Global.targetCellView = null;
    Main.update();
};

Do.outLevel = function () {
    Project.outLevel($Project);
    Main.update();
};

Do.intoLevel = function () {
    Project.intoLevel($Project);
    Main.update();
};

Do.inputText = function (d, text) {
    Global.targetCellView = d;
    d.cell.text = text;
    var grid = Project.currentGrid($Project);
    var cell = Autocomplete.updateFromText(grid, d.cell, d.c, d.r);
    Global.targetCellView.cell = cell;
    Main.update();
};

Do.insertRow = function (d, after) {
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

Do.insertColumn = function (d, after) {
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

Do.deleteCell = function (d, deleteColumn) {
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

Do.showFrame = function (d, x) {
    x = Math.max(0, Math.min(159, x));
    var numFrames = Cell.numFrames(d.cell);
    var fetchFrame = Math.floor(numFrames * x / 160);
    var grid = Project.currentGrid($Project);
    Execute.executeColumn(grid, d.c, fetchFrame);
    Ui.draw();
};

Do.toggleFullScreen = function () {
    Global.fullScreen = !Global.fullScreen;
    Main.update();
};

Do.play = function () {
    $Project.currentFrame -= 1;
    Global.lastTickTime = 0;
    Global.play = true;
    Global.lastTickTime = performance.now();
    Global.framesToAdvance = 1;

    Main.update();
};

Do.maybeRedrawAfterScroll = function (scrollTop, scrollLeft) {
    var box = boxInSight(scrollTop, scrollLeft);
    var lastBox = Global.boxInSight;
    if (
        box.leftC !== lastBox.leftC ||
        box.rightC !== lastBox.rightC ||
        box.topR !== lastBox.topR ||
        box.bottomR !== lastBox.bottomR
    ) {
        Global.boxInSight = box;
        Ui.draw();
    }
};

var boxInSight = function (top, left) {
    top -= 74;
    left -= 54;
    var bottom = top + window.innerHeight;
    var right = left + window.innerWidth;
    var height = 140;
    var width = 190;
    var extra = 50;

    var leftC = Math.floor((left + width - 160 - extra) / width);
    var rightC = Math.floor((right - 10 - 4 + extra) / width);
    var topR = Math.floor((top + height - 100 - extra) / height);
    var bottomR = Math.floor((bottom - 10 - 4 + extra) / height);

    return {
        leftC: leftC,
        rightC: rightC,
        topR: topR,
        bottomR: bottomR,
    };
};

Global.boxInSight = boxInSight(0, 0);

})();
