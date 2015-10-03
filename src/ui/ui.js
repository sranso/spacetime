'use strict';
var Ui = {};
(function () {

var gridHtml = d3.selection();

Ui.setup = function () {
    Keyboard.setup();
    Webgl.setup();
    drawOverallSetup();
    drawGridSetup();
};

Ui.draw = function () {
    __stats.draw_time = performance.now();
    Webgl.clear();
    drawGrid();
    __stats.draw_time = performance.now() - __stats.draw_time;
};

var drawOverallSetup = function () {
    d3.select(document)
        .on('keydown', function () { Keyboard.inputEvent(Keyboard.keyForEvent(), 'down') })
        .on('keyup', function () { Keyboard.inputEvent(Keyboard.keyForEvent(), 'up') })
        .on('keypress', function () {
            Keyboard.keypressEvent(d3.event.keyCode)
        })
        .on('mousedown', function () {
            Global.currentInput.mouseDown = true;
            if (!d3.event.shiftKey) {
                Do.deselectCell();
            }
        })
        .on('mouseup', function () {
            Global.currentInput.mouseDown = false;
        })
        .on('mousemove', function () {
            var mouse = d3.mouse(document.body);
            Global.currentInput.mouseX = mouse[0];
            Global.currentInput.mouseY = mouse[1];
        })
        .on('contextmenu', function () {
            d3.event.preventDefault();
        }) ;
};


//////////////// Grid

var drawGridSetup = function () {
    gridHtml = d3.select('#grid');
};

var drawTick = 0;

var drawGrid = function () {
    var grid = Project.currentGrid($Project);
    drawTick += 1;

    var cells = [];
    var numColumns = Math.min(grid.cells.length, 60);
    for (var c = 0; c < numColumns; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = grid.cells[c][r];
            cells.push({
                cell: cell,
                c: c,
                r: r,
                drawTick: drawTick,
            });
        }
    }

    var cellEls = gridHtml.selectAll('.cell')
        .data(cells) ;

    var cellEnterEls = cellEls.enter().append('div')
        .attr('class', 'cell')
        .on('mousedown', function (d) {
            if (d3.event.shiftKey) {
                Do.changeCellArgs(d);
            } else {
                Do.selectCell(d);
            }
            d3.event.stopPropagation();
        })
        .on('dblclick', function (d) {
            Do.openCell(d);
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
            Do.inputText(d, this.textContent);
        })
        .on('dblclick', function (d) {
            d3.event.stopPropagation();
        })
        .on('keydown', function (d) {
            Keyboard.textInputEvent(d, Keyboard.keyForEvent());
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        })

    cellEnterEls.append('div')
        .attr('class', 'result')
        .on('mousemove', function (d) {
            Do.showFrame(d, d3.mouse(this)[0]);
        })
        .on('mouseleave', function (d) {
            if (d.drawTick === drawTick) {
                Do.showFrame(d, 0);
            }
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
        .text(function (d) {
            var result = d.cell.result;
            if (result.error) {
                return result.error;
            } else if (result.type === Result.number) {
                return result.value;
            } else {
                return '';
            }
        })
        .each(function (d) {
            if (d.cell.result.type === Result.quads) {
                Do.drawResult(d);
            }
        }) ;
};

})();
