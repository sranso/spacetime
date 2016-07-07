'use strict';
global.Ui = {};
(function () {

var canvas;
var ctx;

Ui.initialize = function () {
    canvas = document.getElementById('canvas');
    canvas.width = window.devicePixelRatio * window.innerWidth;
    canvas.height = window.devicePixelRatio * window.innerHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    ctx = canvas.getContext('2d');
    ctx.font = '12px monospace';
    ctx.scale(2, 2);
    ctx.translate(60, 40);
};

Ui.draw = function () {
    var project = get($head, Commit.tree);
    var parentCell = get(project, Project.cell);

    var columns = get(parentCell, Cell.columns);
    var lenColumns = len(columns);

    ctx.strokeStyle = '#ccc';
    ctx.fillStyle = '#333';

    var j;
    for (j = 0; j < lenColumns; j++) {
        var cells = getAt(columns, j);
        var lenCells = len(cells);
        var x = 156 * j;

        var i;
        for (i = 0; i < lenCells; i++) {
            var cell = getAt(cells, i);
            var y = 110 * i;

            ctx.lineWidth = 2;
            ctx.rect(x, y + 20, 144, 90);
            ctx.stroke();

            var text = val(get(cell, Cell.text));
            ctx.fillText(text, x + 4, y + 15);
        }
    }
};

})();
