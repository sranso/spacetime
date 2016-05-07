'use strict';
global.Do = {};
(function () {

Do.selectCell = function (d) {
    deselectCellWithoutDraw();
    Global.targetCellView = d;
    Ui.draw();
};

var deselectCellWithoutDraw = function () {
    Global.targetCellView = null;
    Global.targetCellArg = 0;
    window.getSelection().removeAllRanges();
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

Do.toLevel = function (d) {
    Project.toLevel($Project, d.i);
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
    if (!d) {
        return;
    }
    var grid = Project.currentGrid($Project);
    var r = d.r;
    Grid.insertRow(grid, r, after);
    if (after) {
        r++;
    }
    Global.targetCellView = {
        cell: grid.cells[d.c][r],
        c: d.c,
        r: r,
    };
    Main.update();
    if (Global.inputCell) {
        var cellEl = Global.cellEls[d.c][r];
        d3.select(cellEl).select('.text').node().focus();
    }
};

Do.insertColumn = function (d, after) {
    if (!d) {
        return;
    }
    var grid = Project.currentGrid($Project);
    var c = d.c;
    Grid.insertColumn(grid, c, after);
    if (after) {
        c++;
    }
    Global.targetCellView = {
        cell: grid.cells[c][d.r],
        c: c,
        r: d.r,
    };
    Main.update();
    if (Global.inputCell) {
        var cellEl = Global.cellEls[c][d.r];
        d3.select(cellEl).select('.text').node().focus();
    }
};

Do.deleteCell = function (d, deleteColumn) {
    if (!d) {
        return;
    }
    var grid = Project.currentGrid($Project);
    var c = d.c;
    var r = d.r;
    if (deleteColumn) {
        Grid.deleteColumn(grid, c);
        c--;
        if (c < 0) {
            c = 0;
        }
    } else {
        Grid.deleteRow(grid, r);
        r--;
        if (r < 0) {
            r = 0;
        }
    }
    Global.targetCellView = {
        cell: grid.cells[c][r],
        c: c,
        r: r,
    }
    Main.update();
    if (Global.inputCell) {
        var cellEl = Global.cellEls[c][r];
        d3.select(cellEl).select('.text').node().focus();
    }
};

Do.showFrame = function (d, x) {
    var grid = Project.currentGrid($Project);
    Execute.executeColumn(grid, d.c, frameForCell(d.cell, x));
    Ui.draw();
};

var frameForCell = function (cell, x) {
    x = Math.max(0, Math.min(x, 159));
    var numFrames = Cell.numFrames(cell);
    return Math.floor(numFrames * x / 160);
};

Do.changeCurrentFrame = function (x) {
    var grid = Project.currentGrid($Project);
    var c = Math.floor((x + 10) / 190);
    c = Math.max(0, Math.min(c, grid.cells.length - 1));
    var ffc = Grid.frameForColumn(grid, c);
    var xOverCell = x - c * 190 - 4;
    var frame = frameForCell(ffc.cell, x) + ffc.startFrame;
    $Project.currentFrame = frame;
    Ui.draw();
};

Do.toggleFullScreen = function () {
    Global.fullScreen = !Global.fullScreen;
    if (Global.fullScreen) {
        Global.lastScrollTop = document.body.scrollTop;
        Global.lastScrollLeft = document.body.scrollLeft;

        Main.update();
    } else {
        Main.update();

        document.body.scrollTop = Global.lastScrollTop;
        document.body.scrollLeft = Global.lastScrollLeft;
    }
};

Do.playPause = function () {
    if (Global.play) {
        Global.play = false;
        Global.wasPlaying = true;
        Ui.draw();
        Global.wasPlaying = false;
    } else {
        var cell = Project.currentCell($Project);
        var numFrames = Cell.numFrames(cell);
        if ($Project.currentFrame >= numFrames - 1) {
            $Project.currentFrame = -1;
        } else {
            $Project.currentFrame -= 1;
        }
        Global.lastTickTime = 0;
        Global.play = true;
        Global.lastTickTime = performance.now();
        Global.framesToAdvance = 1;
        Global.tickTimeAccrued = 0;

        Main.update();
    }
};

Do.goToBeginning = function () {
    $Project.currentFrame = 0;
    Main.update();
};

Do.maybeRedrawAfterScroll = function (scrollTop, scrollLeft) {
    var box = Do.boxInSight(scrollTop, scrollLeft);
    var lastBox = Global.boxInSight;
    if (
        box.leftC !== lastBox.leftC ||
        box.rightC !== lastBox.rightC ||
        box.topR !== lastBox.topR ||
        box.bottomR !== lastBox.bottomR
    ) {
        Global.boxInSight = box;
        Ui.draw();
    } else {
        GridUi.resizeAfterScroll();
    }
};

Do.boxInSight = function (top, left) {
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

})();