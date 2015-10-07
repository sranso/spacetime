'use strict';
var GridUi = {};
(function () {

GridUi.gridHtml = d3.selection();
GridUi.drawTick = 0;

GridUi.setup = function () {
    GridUi.gridHtml = d3.select('#grid');
};

GridUi.drawInfo = function () {
    var grid = Project.currentGrid($Project);

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
                drawTick: Global.drawTick,
            });
        }
    }

    return {
        grid: grid,
        cells: cells,
        leftC: leftC,
        rightC: rightC,
        topR: topR,
        bottomR: bottomR,
    };
};

GridUi.startDraw = function (info) {
    d3.select(document.body)
        .style('min-width', (info.grid.cells.length * 190 + 50 + 300) + 'px')
        .style('min-height', (info.grid.cells[0].length * 140 + 50 + 300) + 'px') ;

    d3.select('#canvas')
        .style('left', (info.leftC * 190 + 50) + 'px')
        .style('width', ((info.rightC - info.leftC + 1) * 190) + 'px')
        .style('top', (info.topR * 140 + 50) + 'px')
        .style('height', ((info.bottomR - info.topR + 1) * 140) + 'px') ;

    GridUi.gridHtml
        .style('display', 'block') ;

    d3.select('#full-screen-text')
        .text('') ;
};

})();
