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

var captureInput = function (cell, currentFrame) {
    if (currentFrame < 0) {
        return -1;
    }
    currentFrame += cell.startFrame;
    var endFrame = cell.endFrame;
    if (endFrame === Infinity) {
        endFrame = cell.grid.numFrames - 1;
    }
    if (currentFrame <= endFrame) {
        cell.input[currentFrame] = Global.capturedInput;
        return currentFrame;
    } else {
        return -1;
    }
};

Transformation.immediate = function (operation) {
    var transformation = Transformation.create(operation.text, immediateTransform);
    transformation.operation = operation;
    return transformation;
};

var immediateTransform = function (cell, currentFrame, pGrid, c, r) {
    currentFrame = captureInput(cell, currentFrame);
    var argCells = Cell.argCells(cell, pGrid, c, r);

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

var linearTransform = function (cell, currentFrame, pGrid, c, r) {
    var argCells = Cell.argCells(cell, pGrid, c, r);
    var main = argCells[0];
    var additional = argCells.slice(1);

    var grid = cell.grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';

    var numMainFrames = Cell.numFrames(main);
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
    currentFrame = captureInput(cell, currentFrame);

    var atFrame = 0;
    main.grid.cells.forEach(function (oldColumn, subC) {
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
            Execute.transformCell(linearCell, currentFrame, grid, subC, column.length - 1);
        }
    });

    transformDynamicHistory(cell, argCells);
};


Transformation.none = Transformation.create('none', function () {
    throw new Error('illegal Transformation.none used');
});

Transformation.empty = Transformation.immediate(Operation.empty);

Transformation.detached = Transformation.create('detached', function (cell, currentFrame) {
    currentFrame = captureInput(cell, currentFrame);
    Execute.transformGrid(cell.grid, currentFrame);
});

Transformation.expand = Transformation.create('expand', function (cell, currentFrame, pGrid, pC, pR) {
    currentFrame = captureInput(cell, currentFrame);
    var argCells = Cell.argCells(cell, pGrid, pC, pR);
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
            Execute.transformCell(cell, currentFrame, grid, c, r);
        }
        var numFrames = Cell.numFrames(cell);
        grid.numFrames += numFrames;
        currentFrame -= numFrames;
    }

    transformDynamicHistory(cell, argCells);
});

// TODO: re-input on sample/drop
Transformation.sample = Transformation.create('sample', function (cell, currentFrame, grid, c, r) {
    var argCells = Cell.argCells(cell, grid, c, r);
    var main = argCells[0];
    Execute.executeArg(cell, 0, 2, grid, c, r);

    var sampleNumFrames = argCells[1].result;
    cell.grid = main.grid;
    cell.startFrame = main.startFrame;
    cell.endFrame = main.startFrame + sampleNumFrames - 1;
    currentFrame = captureInput(cell, currentFrame);

    transformDynamicHistory(cell, argCells);
});

Transformation.drop = Transformation.create('drop', function (cell, currentFrame, grid, c, r) {
    var argCells = Cell.argCells(cell, grid, c, r);
    var main = argCells[0];
    Execute.executeArg(cell, 0, 2, grid, c, r);

    var dropNumFrames = argCells[1].result;
    cell.grid = main.grid;
    cell.startFrame = main.startFrame + dropNumFrames;
    cell.endFrame = main.endFrame;
    currentFrame = captureInput(cell, currentFrame);

    transformDynamicHistory(cell, argCells);
});

Transformation.input = function (inputType) {
    var operation = Operation.cloneWithoutData(Operation.input);
    operation.text = inputType;
    operation.data = inputType;
    var transformation = Transformation.create(inputType, immediateTransform);
    transformation.operation = operation;
    return transformation;
};

})();
