'use strict';
var GridUi = {};
(function () {

GridUi.drawTick = 0;

var lastDrawInfo;

GridUi.drawInfo = function () {
    var grid = Project.currentGrid($Project);

    var box = Global.boxInSight;
    var leftC = Math.max(0, Math.min(box.leftC, grid.cells.length - 1));
    var rightC = Math.min(box.rightC, grid.cells.length - 1);
    var topR = Math.max(0, Math.min(box.topR, grid.cells[0].length - 1));
    var bottomR = Math.max(0, Math.min(box.bottomR, grid.cells[0].length - 1));

    var cells = [];
    for (var c = leftC; c <= rightC; c++) {
        for (var r = topR; r <= bottomR; r++) {
            var cell = grid.cells[c][r];
            cells.push({
                cell: cell,
                grid: grid,
                c: c,
                r: r,
                drawTick: Global.drawTick,
            });
        }
    }

    var areas = [];
    grid.areas.forEach(function (area) {
        var c1 = area.coords[0];
        var r1 = area.coords[1];
        var c2 = area.coords[2];
        var r2 = area.coords[3];
        var offScreen = (
            c2 < leftC ||
            c1 > rightC ||
            r2 < topR ||
            r1 > bottomR
        );
        if (!offScreen) {
            areas.push({
                area: area,
                drawTick: Global.drawTick,
            });
        }
    });

    lastDrawInfo = {
        grid: grid,
        cells: cells,
        areas: areas,
        leftC: leftC,
        rightC: rightC,
        topR: topR,
        bottomR: bottomR,
    };
    return lastDrawInfo;
};

GridUi.startDraw = function (info) {
    var minWidth = info.grid.cells.length * 190 + window.innerWidth / 2;
    var minHeight = info.grid.cells[0].length * 140 + window.innerHeight / 2;

    d3.select(document.body)
        .style('min-width', minWidth + 'px')
        .style('min-height', minHeight + 'px') ;

    d3.select('#canvas')
        .style('left', (info.leftC * 190 + 50) + 'px')
        .style('width', ((info.rightC - info.leftC + 1) * 190) + 'px')
        .style('top', (info.topR * 140 + 50) + 'px')
        .style('height', ((info.bottomR - info.topR + 1) * 140) + 'px') ;

    d3.select('#grid')
        .style('display', 'block') ;

    d3.select('#full-screen-text')
        .text('') ;

    GridUi.resizeAfterScroll();
};

GridUi.resizeAfterScroll = function () {
    var info = lastDrawInfo;

    var gridHeight = info.grid.cells[0].length * 140;
    var exposed = gridHeight - document.body.scrollTop;
    var emptySpace = window.innerHeight - exposed;
    var height = Math.max(emptySpace - 200, 100);

    d3.select('#grid-bottom-container')
        .style('height', height + 'px') ;

    var marginLeft = 50 - document.body.scrollLeft;

    var width = info.grid.cells.length * 190 - 20;

    d3.select('#grid-bottom')
        .style('margin-left', marginLeft + 'px')
        .style('width', width + 'px')
};

})();
