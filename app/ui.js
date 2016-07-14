'use strict';
global.Ui = {};
(function () {

var canvas;
var autocompleteContainer;
var autocompleteInput;

var ctx;

global.zoom = 1;
var xSpacing = 160;
var ySpacing = 112;
var xHalfGap = 5;
var yHalfGap = 2;
var xTranslation = 60;
var yTranslation = 40;

var mouseDown = false;
var movingGrid = false;
var mouseX = 0;
var mouseY = 0;

Ui.initialize = function () {
    canvas = document.getElementById('canvas');
    canvas.width = window.devicePixelRatio * window.innerWidth;
    canvas.height = window.devicePixelRatio * window.innerHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    autocompleteContainer = document.getElementById('autocomplete-container');
    autocompleteInput = document.getElementById('autocomplete-input');

    ctx = canvas.getContext('2d');
    ctx.font = '12px monospace';

    canvas.addEventListener('click', function (e) {
        if (movingGrid) {
            return;
        }
        var x = Math.round((e.clientX - xTranslation) / zoom);
        var y = Math.round((e.clientY - yTranslation) / zoom);
        $c = Math.floor(x / xSpacing);
        $r = Math.floor(y / ySpacing);

        var project = get($head, Commit.tree);
        var parentCell = get(project, Project.cell);
        var columns = get(parentCell, Cell.columns);
        var lenColumns = len(columns);
        if (lenColumns > 0) {
            var lenCells = len(getAt(columns, 0));
        } else {
            var lenCells = 0;
        }

        if ($c >= lenColumns) {
            $c = lenColumns;
        }
        if ($c < 0) {
            $c = 0;
        }
        if ($r >= lenCells) {
            $r = lenCells;
        }
        if ($r < 0) {
            $r = 0;
        }

        Autocomplete.selectCell();
        Main.update();
        e.preventDefault();
    });

    canvas.addEventListener('mousedown', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        mouseDown = true;
        e.preventDefault();
    });

    canvas.addEventListener('mouseup', function (e) {
        mouseDown = false;
        setTimeout(function () {
            movingGrid = false;
        });
    });

    canvas.addEventListener('mousemove', function (e) {
        if (!movingGrid) {
            var moved = (
                Math.abs(e.clientX - mouseX) > 2 ||
                Math.abs(e.clientY - mouseY) > 2
            );
            if (mouseDown && moved) {
                movingGrid = true;
            }
        }
        if (movingGrid) {
            var xDiff = e.clientX - mouseX;
            var yDiff = e.clientY - mouseY;
            xTranslation += xDiff;
            yTranslation += yDiff;
            mouseX = e.clientX;
            mouseY = e.clientY;
            Ui.draw();
        }
    });

    window.addEventListener('wheel', function (e) {
        var x = Math.round((e.clientX - xTranslation) / zoom);
        var y = Math.round((e.clientY - yTranslation) / zoom);

        var absDelta = Math.abs(e.deltaY);
        var sign = e.deltaY < 0 ? +1 : -1;
        var zoomFactor = 1.0 + (sign * Math.sqrt(absDelta) / 100.0);
        zoom *= zoomFactor;

        xTranslation = e.clientX - x * zoom;
        yTranslation = e.clientY - y * zoom;
        Ui.draw();
    });
};

Ui.draw = function () {
    console.time('UI.draw');

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.translate(xTranslation, yTranslation);
    ctx.scale(zoom, zoom);

    Ui.moveAutocomplete();

    var project = get($head, Commit.tree);
    var parentCell = get(project, Project.cell);
    var columns = get(parentCell, Cell.columns);
    var lenColumns = len(columns);
    if (lenColumns > 0) {
        var lenCells = len(getAt(columns, 0));
    } else {
        var lenCells = 0;
    }

    ctx.strokeStyle = '#ccc';
    ctx.fillStyle = '#333';
    ctx.lineWidth = 2;

    var j;
    for (j = 0; j < lenColumns; j++) {
        var cells = getAt(columns, j);
        var x = xSpacing * j + xHalfGap;

        var i;
        for (i = 0; i < lenCells; i++) {
            var cell = getAt(cells, i);
            var y = ySpacing * i + yHalfGap;

            if (j === $c && i === $r) {
                ctx.strokeStyle = '#333';
                ctx.fillStyle = 'rgba(26,138,249,0.2)';
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

    var newColumn = $c === lenColumns;
    var newRow = $r === lenCells;
    if (newColumn || newRow) {
        ctx.strokeStyle = '#080';
        ctx.fillStyle = 'rgba(26,138,249,0.2)';
        ctx.lineWidth = 4;

        var x = xSpacing * $c + xHalfGap;
        var y = ySpacing * $r + yHalfGap;
        ctx.beginPath();
        ctx.rect(x - 1, y + 14, 148, 94);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();

    console.timeEnd('UI.draw');
};

Ui.moveAutocomplete = function () {
    var autocompleteZoom = Math.max(0.6, Math.min(zoom, 3.0)) * 0.5;

    var x = ($c * xSpacing * zoom) + xTranslation + 2;
    var y = ($r * ySpacing * zoom) + yTranslation - 1;
    autocompleteContainer.style.top = y + 'px';
    autocompleteContainer.style.left = x + 'px';

    autocompleteContainer.style.transform = 'scale(' + autocompleteZoom + ')';
};

})();
