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
        .on('mousedown', function () {
            if (!d3.event.shiftKey) {
                Global.targetCellView = null;
            }
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
        .on('mousedown', function (d) {
            if (d3.event.shiftKey) {
                View.changeCellArgs(d);
            } else {
                View.selectCell(d);
            }
            d3.event.stopPropagation();
        })
        .on('dblclick', function (d) {
            View.openCell(d);
            d3.event.preventDefault();
        }) ;

    cellEnterEls.append('div')
        .attr('class', 'text')
        .attr('contenteditable', true)
        .on('focus', function (d) {
            Global.inputCell = true;
        })
        .on('blur', function (d) {
            Global.inputCell = false;
        })
        .on('input', function (d) {
            View.inputText(d, this.textContent);
        })
        .on('keydown', function (d) {
            Input.textInputEvent(d, Input.keyForEvent());
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        })

    cellEnterEls.append('div')
        .attr('class', 'result')
        .on('mousemove', function (d) {
            View.showFrame(d, d3.mouse(this)[0]);
        })
        .on('mouseleave', function (d) {
            View.showFrame(d, 0);
        }) ;

    cellEls.exit().remove();

    var targetCell = Global.targetCellView ? Global.targetCellView.cell : Cell.none;

    Global.cellEls = [];
    cellEls.each(function (d) {
        if (!Global.cellEls[d.c]) {
            Global.cellEls[d.c] = [];
        }
        Global.cellEls[d.c][d.r] = this;
    });

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
