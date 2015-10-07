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
    if (Global.fullScreen) {
        drawFullScreen();
    } else {
        drawGrid();
    }
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
            Global.currentInput.mouseX = d3.event.clientX;
            Global.currentInput.mouseY = window.innerHeight - d3.event.clientY;
        })
        .on('contextmenu', function () {
            d3.event.preventDefault();
        })
        .on('scroll', function () {
            Do.maybeRedrawAfterScroll(document.body.scrollTop, document.body.scrollLeft);
        }) ;

    d3.select(window)
        .on('resize', function () {
            Do.maybeRedrawAfterScroll(document.body.scrollTop, document.body.scrollLeft);
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
    var box = Global.boxInSight;
    var leftC = Math.max(0, Math.min(box.leftC, grid.cells.length - 1));
    var rightC = Math.min(box.rightC, grid.cells.length - 1);
    var topR = Math.max(0, Math.min(box.topR, grid.cells[0].length - 1));
    var bottomR = Math.max(0, Math.min(box.bottomR, grid.cells[0].length - 1));
    for (var c = leftC; c <= rightC; c++) {
        for (var r = topR; r <= bottomR; r++) {
            var cell = grid.cells[c][r];
            cells.push({
                cell: cell,
                c: c,
                r: r,
                drawTick: drawTick,
            });
        }
    }

    d3.select(document.body)
        .style('min-width', (grid.cells.length * 190 + 50 + 300) + 'px')
        .style('min-height', (grid.cells[0].length * 140 + 50 + 300) + 'px') ;

    d3.select('#canvas')
        .style('left', (leftC * 190 + 50) + 'px')
        .style('width', ((rightC - leftC + 1) * 190) + 'px')
        .style('top', (topR * 140 + 50) + 'px')
        .style('height', ((bottomR - topR + 1) * 140) + 'px') ;

    Webgl.clear();

    gridHtml
        .style('display', 'block') ;

    d3.select('#full-screen-text')
        .text('') ;

    var cellEls = gridHtml.selectAll('.cell')
        .data(cells, function (d) {
            return d.c + ' ' + d.r;
        }) ;

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
                var c = d.c - leftC;
                var r = bottomR - d.r;
                Webgl.drawGridCell(d.cell.result.value, c, r);
            }
        }) ;
};

//////////////// Full Screen

var drawFullScreen = function () {
    gridHtml
        .style('display', 'none') ;

    var cell = Project.currentCell($Project);
    var result = cell.result;

    d3.select('#canvas')
        .style('left', '0px')
        .style('width', window.innerWidth + 'px')
        .style('top', '0px')
        .style('height', window.innerHeight + 'px') ;

    Webgl.clear();

    d3.select('#full-screen-text')
        .text(function () {
            if (result.error) {
                return result.error;
            } else if (result.type === Result.number) {
                return result.value;
            } else {
                return '';
            }
        }) ;

    if (result.type === Result.quads) {
        Webgl.drawFullScreen(cell.result.value);
    }
};

})();
