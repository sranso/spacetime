'use strict';
global.Ui = {};
(function () {

var autocomplete;
var autocompleteEntry;
var canvas;
var ctx;

var zoom = 1;
var xSpacing = 160;
var ySpacing = 112;
var xHalfGap = 5;
var yHalfGap = 2;
var xTranslation = 60;
var yTranslation = 40;

Ui.initialize = function () {
    canvas = document.getElementById('canvas');
    canvas.width = window.devicePixelRatio * window.innerWidth;
    canvas.height = window.devicePixelRatio * window.innerHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    ctx = canvas.getContext('2d');
    ctx.font = '12px monospace';
    ctx.scale(2 * zoom, 2 * zoom);
    ctx.translate(xTranslation, yTranslation);

    autocomplete = document.getElementById('autocomplete');
    autocompleteEntry = document.getElementById('autocomplete-entry');

    canvas.addEventListener('mousedown', function (e) {
        var x = Math.round(e.clientX / zoom) - xTranslation;
        var y = Math.round(e.clientY / zoom) - yTranslation;
        $c = Math.floor(x / xSpacing);
        $r = Math.floor(y / ySpacing);
        Main.update();
        e.preventDefault();
    });
};

Ui.draw = function () {
    console.time('UI.draw');
    var project = get($head, Commit.tree);
    var parentCell = get(project, Project.cell);

    var columns = get(parentCell, Cell.columns);
    var lenColumns = len(columns);

    if ($c >= 0 && $c < lenColumns) {
        var selectedColumn = getAt(columns, $c);
        if ($r >= 0 && $r < len(selectedColumn)) {
            var selectedCell = getAt(selectedColumn, $r);
        }
    }
    if (selectedCell) {
        var x = ($c * xSpacing + xTranslation) * zoom + 2;
        var y = ($r * ySpacing + yTranslation) * zoom - 1;
        autocomplete.style.display = 'block';
        autocomplete.style.top = y + 'px';
        autocomplete.style.left = x + 'px';
        var text = val(get(selectedCell, Cell.text));
        autocompleteEntry.value = text;
        autocompleteEntry.focus();
        autocompleteEntry.setSelectionRange(0, text.length);
    } else {
        autocomplete.style.display = 'none';
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ccc';
    ctx.fillStyle = '#333';
    ctx.lineWidth = 2;

    var j;
    for (j = 0; j < lenColumns; j++) {
        var cells = getAt(columns, j);
        var lenCells = len(cells);
        var x = xSpacing * j + xHalfGap;

        var i;
        for (i = 0; i < lenCells; i++) {
            var cell = getAt(cells, i);
            var y = ySpacing * i + yHalfGap;

            if (j === $c && i === $r) {
                ctx.strokeStyle = '#333';
                ctx.fillStyle = 'rgba(0,100,255,0.2)';
                ctx.lineWidth = 4;

                ctx.beginPath();
                ctx.rect(x - 1, y + 14, 148, 94);
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = '#ccc';
                ctx.fillStyle = '#333';
                ctx.lineWidth = 2;
            } else {
                ctx.strokeRect(x, y + 15, 146, 92);  // 144 by 90 internal area
            }

            var text = val(get(cell, Cell.text));
            ctx.fillText(text, x + 2, y + 11);
        }
    }
    console.timeEnd('UI.draw');
};

})();
