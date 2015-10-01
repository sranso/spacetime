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

var startOfDynamicHistory = function (argCells) {
    var main = argCells[0];
    var additional = argCells.slice(1);

    if (main) {
        var history = main.dynamicHistory.slice();
    } else {
        var history = [];
    }

    additional.forEach(function (original) {
        var argCell = Cell.clonePostTransform(original);
        argCell.detached = true;

        history.push(argCell);
    });

    return history;
};

var transformDynamicHistory = function (cell, argCells) {
    cell.dynamicHistory = startOfDynamicHistory(argCells);

    var historyCell = Cell.clonePostTransform(cell);
    historyCell.args = Cell.autoArgs[cell.args.length];
    cell.dynamicHistory.push(historyCell);
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
    grid.cells[0] = startOfDynamicHistory(argCells);

    var baseCell = Cell.cloneForSimilar(cell);
    baseCell.args = Cell.autoArgs[cell.args.length];

    grid.cells[0].push(baseCell);

    grid.numFrames = 1;

    transformDynamicHistory(cell, argCells);
};

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

    var numMainFrames = Cell.numFrames(main);

    var atFrame = 0;

    main.grid.cells.forEach(function (oldColumn, c) {
        var column = oldColumn.slice();
        var subMain = column[column.length - 1];

        grid.cells.push(column);
        var numSubFrames = Cell.numFrames(subMain);

        additional.forEach(function (original) {
            var argCell = Cell.clonePostTransform(original);
            argCell.detached = true;
            argCell.startFrame += atFrame;
            argCell.endFrame = argCell.startFrame + numSubFrames - 1;

            column.push(argCell);
        });

        atFrame += numSubFrames;

        var linearCell = Cell.cloneForSimilar(cell);
        linearCell.args = Cell.autoArgs[cell.args.length];

        column.push(linearCell);

        if (numMainFrames > 1) {
            Execute.transformCell(grid, linearCell, c, column.length - 1);
        }
    });

    grid.numFrames = main.grid.numFrames;

    // TODO: maybe some linear transforms will not keep number
    // of frames the same.
    cell.startFrame = main.startFrame;
    cell.endFrame = main.endFrame;
    if (numMainFrames === 1) {
        cell.operation = cell.transformation.operation;
    } else {
        cell.operation = Operation.none;
    }

    transformDynamicHistory(cell, argCells);
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

    var argLayer = startOfDynamicHistory(argCells);
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
        var cell;
        for (var r = area.coords[1]; r <= area.coords[3]; r++) {
            cell = grid.cells[c][r];
            Execute.transformCell(grid, cell, c, r);
        }
        grid.numFrames += Cell.numFrames(cell);
    }

    transformDynamicHistory(cell, argCells);
});

Transformation.sample = Transformation.create('sample', function (atGrid, cell, atC, atR) {
    var argCells = Execute.transformArgs(atGrid, cell, atC, atR);
    var main = argCells[0];
    var sampleCell = argCells[1];
    var sampleC = atC + cell.args[2];
    var sampleR = atR + cell.args[3];
    Execute.executeCell(atGrid, sampleCell, 0, sampleC, sampleR);

    var sampleNumFrames = sampleCell.result;

    cell.grid = main.grid;
    cell.startFrame = main.startFrame;
    cell.endFrame = main.startFrame + sampleNumFrames - 1;

    cell.grid.numFrames = main.grid.numFrames;

    transformDynamicHistory(cell, argCells);
});

})();
