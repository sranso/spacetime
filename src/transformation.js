'use strict';
var Transformation = {};
(function () {

Transformation.create = function (text, transform) {
    return {
        text: text,
        transform: transform,
        operation: Operation.none,
        data: 0,
    };
};

Transformation.cloneWithoutData = function (original) {
    var transformation = Transformation.create(
        original.text,
        original.transform
    );
    transformation.operation = original.operation;
    // transformation.data = 0;
    return transformation;
};

var basicStartOfTransform = function (main, additional) {
    if (main) {
        var layer = main.grid.cells[0].slice(0, -1);
        var mainClone = Cell.clonePostTransform(main);
        mainClone.args = Cell.autoArgs[main.args.length];

        layer.push(mainClone);
    } else {
        var layer = [];
    }

    additional.forEach(function (original) {
        var argCell = Cell.clonePostTransform(original);
        argCell.detached = true;

        layer.push(argCell);
    });

    return layer;
};

Transformation.immediate = function (operation) {
    var transformation = Transformation.create(operation.text, immediateTransform);
    transformation.operation = operation;
    return transformation;
};

var immediateTransform = function (atGrid, cell, atC, atR) {
    var argCells = Execute.transformArgs(atGrid, cell, atC, atR);

    cell.operation = cell.transformation.operation;

    var grid = cell.grid = Grid.create();
    grid.layer = 'under';
    grid.cells[0] = basicStartOfTransform(argCells[0], argCells.slice(1));

    var baseCell = Cell.cloneForSimilar(cell);
    baseCell.operation = cell.transformation.operation;
    baseCell.args = Cell.autoArgs[cell.args.length];
    baseCell.base = true;

    grid.cells[0].push(baseCell);

    grid.numFrames = 1;
};

Transformation.identity = Transformation.create('identity', function (atGrid, cell, atC, atR) {
    var argCells = Execute.transformArgs(atGrid, cell, atC, atR);
    var main = argCells[0];

    var grid = cell.grid = Grid.create();
    grid.layer = 'under';
    grid.cells[0] = basicStartOfTransform(main, Cell.noArgs);
    grid.numFrames = main.grid.numFrames;
});

Transformation.linear = function (operation) {
    var transformation = Transformation.create(operation.text, linearTransform);
    transformation.operation = operation;
    return transformation;
};

var linearTransform = function (atGrid, cell, atC, atR) {
    var argCells = Execute.transformArgs(atGrid, cell, atC, atR);
    var main = argCells[0];
    var additional = argCells.slice(1);

    var grid = cell.grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';

    var atFrame = 0;

    main.grid.cells.forEach(function (oldColumn, c) {
        var column = oldColumn.slice();
        var subMain = column[column.length - 1];

        grid.cells.push(column);

        additional.forEach(function (original) {
            var argCell = Cell.clonePostTransform(original);
            argCell.detached = true;
            argCell.startFrame += atFrame;
            argCell.endFrame = argCell.startFrame + subMain.grid.numFrames - 1;

            column.push(argCell);
        });

        atFrame += subMain.grid.numFrames;

        var linearCell = Cell.cloneForSimilar(cell);
        linearCell.args = Cell.autoArgs[cell.args.length];

        if (subMain.grid.numFrames === 1) {
            linearCell.base = true;
            linearCell.operation = cell.transformation.operation;
        }
        column.push(linearCell);

        if (subMain.grid.numFrames === 1) {
            grid.numFrames += 1;
        } else {
            Execute.transformCell(grid, linearCell, c, column.length - 1);
            grid.numFrames += linearCell.grid.numFrames;
        }
    });
};


Transformation.none = Transformation.create('none', function () {
    throw new Error('illegal Transformation.none used');
});

Transformation.empty = Transformation.immediate(Operation.empty);

Transformation.detached = Transformation.create('detached', function (atGrid, cell) {
    Execute.transformGrid(cell.grid);
});

Transformation.expand = Transformation.create('expand', function (atGrid, cell, atC, atR) {
    var argCells = Execute.transformArgs(atGrid, cell, atC, atR);
    var grid = cell.grid;
    var originalCells = grid.cells;
    var area = grid.areas[0];

    var argLayer = basicStartOfTransform(argCells[0], argCells.slice(1));
    grid.cells = [];
    grid.numFrames = 0;

    for (var c = 0; c <= area.coords[2]; c++) {
        var expanded = originalCells[c].slice(area.coords[1]);
        var column = argLayer.concat(expanded);
        grid.cells.push(column);
    }

    var rowDiff = argLayer.length - area.coords[1];
    grid.areas.forEach(function (area) {
        area.coords[1] += rowDiff;
        area.coords[3] += rowDiff;
    });

    for (var c = 0; c <= area.coords[2]; c++) {
        for (var r = area.coords[1]; r <= area.coords[3]; r++) {
            var cell = grid.cells[c][r];
            Execute.transformCell(grid, cell, c, r);
        }
        grid.numFrames += grid.cells[c][grid.cells[0].length - 1].grid.numFrames;
    }
});

})();
