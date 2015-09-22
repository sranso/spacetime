'use strict';
var Draw = {};
(function () {

var gridHtml = d3.selection();

Draw.setup = function () {
    drawOverallSetup();
    drawGridSetup();
};

Draw.draw = function () {
    __stats.draw_time = performance.now();
    drawGrid();
    __stats.draw_time = performance.now() - __stats.draw_time;
};

var drawOverallSetup = function () {
    d3.select(document)
        .on('keydown', function () { Input.inputEvent(Input.keyForEvent(), 'down') })
        .on('keyup', function () { Input.inputEvent(Input.keyForEvent(), 'up') })
        .on('keypress', function () {
            Input.keypressEvent(d3.event.keyCode)
        })
        .on('click', function () {
            Global.targetCellView = null;
            Draw.draw();
        })
        .on('contextmenu', function () {
            d3.event.preventDefault();
        }) ;
};


//////////////// Grid

var drawGridSetup = function () {
    gridHtml = d3.select('#grid');
};

var adjustArgs = function (d) {
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

var drawGrid = function () {
    var grid = $Project.cellLevels[$Project.currentLevel][0].grid;
    var cells = [];
    var numColumns = Math.min(grid.cells.length, 60);
    for (var c = 0; c < numColumns; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = grid.cells[c][r];
            cells.push({
                cell: cell,
                c: c,
                r: r,
            });
        }
    }

    var cellEls = gridHtml.selectAll('.cell')
        .data(cells) ;

    var cellEnterEls = cellEls.enter().append('div')
        .attr('class', 'cell')
        .on('click', function (d) {
            d3.event.stopPropagation();
            if (d3.event.shiftKey) {
                adjustArgs(d);
            } else {
                Global.targetCellView = d;
                Global.targetCellArg = 0;
                Draw.draw();
            }
        })
        .on('dblclick', function (d) {
            Project.openCell($Project, d.cell, d.c, d.r);
            Global.targetCellView = null;
            Main.update();
            d3.event.preventDefault();
        }) ;

    cellEnterEls.append('div')
        .attr('class', 'text') ;

    cellEnterEls.append('div')
        .attr('class', 'result')
        .on('mousemove', function (d) {
            var x = d3.mouse(this)[0];
            x = Math.max(0, Math.min(159, x));
            var cell = d.cell;
            var fetchFrame = Math.floor(cell.grid.numFrames * x / 160);
            Execute.executeCell(cell, fetchFrame);
            Draw.draw();
        })
        .on('mouseleave', function (d) {
            Execute.executeCell(d.cell, 0);
            Draw.draw();
        }) ;

    cellEls.exit().remove();

    var targetCell = Global.targetCellView ? Global.targetCellView.cell : Cell.none;

    cellEls
        .attr('class', function (d) {
            var classes = ['cell'];
            if (d.cell === targetCell) {
                classes.push('target');
            }
            var t = Global.targetCellView;
            if (t) {
                var argIndex = Cell.argIndex(t.cell, t.c, t.r, d.c, d.r);
                if (argIndex !== -1) {
                    classes.push('arg-' + argIndex);
                }
            }
            return classes.join(' ');
        })
        .style('top', function (d) {
            return (d.r * 140) + 'px';
        })
        .style('left', function (d) {
            return (d.c * 190) + 'px';
        }) ;

    cellEls.select('.text')
        .text(function (d) { return d.cell.text }) ;

    cellEls.select('.result')
        .text(function (d) { return d.cell.result }) ;
};

})();
