'use strict';
var Draw = {};
(function () {

var gridHtml = d3.selection();

Draw.setup = function () {
    drawOverallSetup();
    drawGridSetup();
};

Draw.draw = function () {
    drawGrid();
};

var drawOverallSetup = function () {
    d3.select(document)
        .on('keydown', function () { Input.inputEvent(Input.keyForEvent(), 'down') })
        .on('keyup', function () { Input.inputEvent(Input.keyForEvent(), 'up') })
        .on('keypress', function () {
            Input.keypressEvent(d3.event.keyCode)
        })
        .on('mousedown', Main.mouseDown)
        .on('mouseup', Main.mouseUp)
        .on('mousemove', Main.mouseMove)
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
        .on('dblclick', function (d) {
            Project.openCell($Project, d.cell, d.c, d.r);
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
        })

    cellEls.exit().remove();

    cellEls
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
