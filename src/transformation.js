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

Transformation.clone = function (oldTransformation) {
    var transformation = Transformation.create(oldTransformation.text, oldTransformation.transform);
    transformation.operation = oldTransformation.operation;
    // transformation.data = oldTransformation.data;
    return transformation;
};

var basicStartOfTransform = function (main, additional) {
    if (main) {
        var layer = main.grid.cells[0].slice(0, -1);
        var mainClone = Cell.clone(main);
        mainClone.detached = main.transformation === Transformation.detached;
        mainClone.args = Cell.autoArgs[main.args.length];
        mainClone.gridTick = Global.transformationTick;
        layer.push(mainClone);
    } else {
        var layer = [];
    }

    additional.forEach(function (originalArgCell) {
        var argCell = Cell.clone(originalArgCell);
        argCell.detached = true;
        argCell.gridTick = Global.transformationTick;
        layer.push(argCell);
    });

    return layer;
};

Transformation.immediate = function (operation) {
    var transformation = Transformation.create(operation.text, immediateTransform);
    transformation.operation = operation;
    return transformation;
};

var immediateTransform = function (cell, main, additional) {
    var grid = Grid.create();
    grid.layer = 'under';
    grid.cells[0] = basicStartOfTransform(main, additional);

    var baseCell = Cell.clone(cell);
    baseCell.base = true;
    baseCell.apply = false;
    baseCell.operation = cell.transformation.operation;
    grid.cells[0].push(baseCell);

    grid.numFrames = 1;

    return grid;
};

Transformation.linear = function (operation) {
    var transformation = Transformation.create(operation.text, linearTransform);
    transformation.operation = operation;
    return transformation;
};

var linearTransform = function (cell, main, additional) {
    var grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';

    var sampleStart = 0;
    var sampleInfo = additional.map(function (argCell) {
        if (argCell.transformation.transform === Transformation.sampleAtData.transform) {
            return {
                start: argCell.transformation.data[0],
                cell: argCell.grid.cells[0][argCell.grid.cells[0].length - 2],
            };
        }
        return {
            start: 0,
            cell: argCell,
        };
    });

    var appliedMain = main.grid.cells[0][main.grid.cells[0].length - 1];
    appliedMain.grid.cells.forEach(function (oldColumn, c) {
        var column = oldColumn.slice();

        var r = column.length - 1;
        var subMain = column[column.length - 1];
        sampleInfo.forEach(function (info) {
            var argCell = info.cell;
            var argSampleStart = sampleStart + info.start;
            var argSampleEnd = argSampleStart + subMain.grid.numFrames - 1;

            var layer = basicStartOfTransform(argCell, Cell.noArgs);

            var sampleCell = Cell.create();
            sampleCell.transformation = Transformation.clone(Transformation.sampleAtData);
            sampleCell.transformation.data = [argSampleStart, argSampleEnd];
            sampleCell.apply = true;
            sampleCell.args = Cell.autoArgs[2];
            layer.push(sampleCell);

            var historyCell = Cell.create();
            historyCell.transformation = sampleCell.transformation;
            historyCell.detached = true;
            historyCell.grid = Grid.create();
            historyCell.grid.layer = 'history';
            historyCell.grid.cells.push(layer);
            historyCell.gridTick = Global.transformationTick;

            var r = layer.length - 1;
            Execute.transformCell(historyCell.grid, sampleCell, 0, r);

            column.push(historyCell);
        });

        sampleStart += subMain.grid.numFrames;

        var transformCell = Cell.clone(cell);
        if (subMain.base) {
            transformCell.base = true;
            transformCell.operation = cell.transformation.operation;
        }
        transformCell.args = Cell.autoArgs[cell.args.length];
        transformCell.apply = false;
        column.push(transformCell);


        grid.cells.push(column);

        if (subMain.base) {
            grid.numFrames += 1;
        } else {
            Execute.transformCell(grid, transformCell, c, column.length - 1);
            grid.numFrames += transformCell.grid.numFrames;
        }
    });

    return grid;
};


Transformation.add = Transformation.linear(Operation.add);
Transformation.plusOne = Transformation.linear(Operation.plusOne);
Transformation.double = Transformation.linear(Operation.double);

Transformation.literal = Transformation.immediate(Operation.literal);
Transformation.none = Transformation.immediate(Operation.none);

Transformation.detached = Transformation.create('detached', function (cell) {
    Execute.transformGrid(cell.grid);
    return cell.grid;
});

Transformation.history = Transformation.create('history', function (cell, main, additional) {
    var grid = Grid.create();
    grid.layer = 'history';
    grid.cells[0] = basicStartOfTransform(main, additional);

    if (cell.grid === Grid.none) {
        var historyCell = Cell.clone(cell);
        historyCell.base = false;
        historyCell.operation = Operation.none;
        historyCell.apply = true;
    } else {
        var historyCell = cell.grid.cells[0][cell.grid.cells[0].length - 1];
    }
    historyCell.args = Cell.autoArgs[cell.args.length];
    grid.cells[0].push(historyCell);

    Execute.transformCell(grid, historyCell, 0, grid.cells[0].length - 1);

    grid.numFrames = historyCell.grid.numFrames;

    return grid;
});

Transformation.expand = Transformation.create('expand', function (cell, main, additional) {
    var grid = cell.grid;
    var originalCells = grid.cells;
    var area = grid.areas[0];

    var argLayer = basicStartOfTransform(main, additional);
    grid.cells = [];

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

    return grid;
});

Transformation.sampleAtData = Transformation.create('sampleAtData', function (cell, main, additional) {
    var sampleInfo = cell.transformation.data;
    var frames = [];
    fillFrames(main, frames, sampleInfo[0], sampleInfo[1]);

    var grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';
    frames.forEach(function (originalFrame) {
        var frame = Cell.clone(originalFrame);
        frame.base = false;
        frame.operation = Operation.none;
        frame.detached = true;
        frame.transformation = Transformation.detached;
        frame.gridTick = Global.transformationTick;
        grid.cells.push([frame]);
    });

    var targetSamples = sampleInfo[1] - sampleInfo[0];
    for (var i = frames.length; i < targetSamples; i++) {
        grid.cells.push([Cell.create()]);
    }

    return grid;
});

var fillFrames = function (cell, frames, startSample, endSample) {
    var sample = 0;
    var subCells = cell.grid.cells;
    var r = subCells[0].length - 1;
    for (var c = 0; c < cell.grid.cells.length; c++) {
        var subCell = subCells[c][r];
        var subEnd = sample + subCell.grid.numFrames - 1;
        if (sample <= endSample && subEnd >= startSample) {
            if (subCell.base) {
                Execute.transformCell(cell.grid, subCell, c, r);
                frames.push(subCell);
            } else {
                var newStart = startSample - sample;
                var newEnd = endSample - sample;
                fillFrames(subCell, frames, newStart, newEnd);
            }
        }
        sample = subEnd + 1;
    }
};

})();
