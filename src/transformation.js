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

var immediateTransform = function (cell, main, additional) {
    var grid = Grid.create();
    grid.layer = 'under';
    grid.cells[0] = basicStartOfTransform(main, additional);

    var baseCell = Cell.cloneForSimilar(cell);
    baseCell.operation = cell.transformation.operation;
    baseCell.args = Cell.autoArgs[cell.args.length];
    baseCell.base = true;

    grid.cells[0].push(baseCell);

    grid.numFrames = 1;

    return grid;
};

Transformation.identity = Transformation.create('identity', function (cell, main, additional) {
    var grid = Grid.create();
    grid.layer = 'under';
    grid.cells[0] = basicStartOfTransform(main, Cell.noArgs);
    grid.numFrames = main.grid.numFrames;

    return grid;
});

Transformation.linear = function (operation) {
    var transformation = Transformation.create(operation.text, linearTransform);
    transformation.operation = operation;
    return transformation;
};

var linearTransform = function (cell, main, additional) {
    var grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';

    var atFrame = 0;
    var sampleInfo = additional.map(function (argCell) {
        var argColumn = argCell.grid.cells[0];
        var subArg = argColumn[argColumn.length - 1];
        if (subArg.transformation.transform === Transformation.sampleAtData.transform) {
            return {
                start: subArg.transformation.data[0],
                cell: argColumn[argColumn.length - 2],
            };
        }
        return {
            start: 0,
            cell: argCell,
        };
    });

    main.grid.cells.forEach(function (oldColumn, c) {
        var column = oldColumn.slice();
        var subMain = column[column.length - 1];

        grid.cells.push(column);

        sampleInfo.forEach(function (info) {
            var argCell = info.cell;
            var argFrameStart = atFrame + info.start;
            var argFrameEnd = argFrameStart + subMain.grid.numFrames - 1;

            var layer = basicStartOfTransform(argCell, Cell.noArgs);

            var sampleTransformation = Transformation.create(
                    Transformation.sampleAtData.text,
                    Transformation.sampleAtData.transform
            );
            sampleTransformation.data = [argFrameStart, argFrameEnd];

            var sampleCell = Cell.create();
            sampleCell.args = Cell.autoArgs[2];
            sampleCell.transformation = sampleTransformation
            // sampleCell.group = Group.none; TODO: what group?
            sampleCell.text = 'sample';

            layer.push(sampleCell);

            var cell = Cell.create();
            cell.grid = Grid.create();
            cell.transformation = Transformation.detached;
            // cell.group = Group.none; TODO: what group?
            cell.text = 'sample';

            cell.grid.cells.push(layer);

            column.push(cell);
            Execute.transformCell(grid, cell, c, column.length - 1);
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

    return grid;
};


Transformation.none = Transformation.create('none', function () {
    throw new Error('illegal Transformation.none used');
});

Transformation.empty = Transformation.immediate(Operation.empty);

Transformation.detached = Transformation.create('detached', function (cell) {
    Execute.transformGrid(cell.grid);
    return cell.grid;
});

Transformation.expand = Transformation.create('expand', function (cell, main, additional) {
    var grid = cell.grid;
    var originalCells = grid.cells;
    var area = grid.areas[0];

    var argLayer = basicStartOfTransform(main, additional);
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

    return grid;
});

Transformation.sampleAtData = Transformation.create('sampleAtData', function (cell, main, additional) {
    var sampleInfo = cell.transformation.data;
    var frames = [];
    fillFrames(main, frames, sampleInfo[0], sampleInfo[1]);

    var grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';
    frames.forEach(function (original) {
        var frame = Cell.clonePostTransform(original);
        frame.operation = Operation.none;
        frame.base = false;
        frame.detached = true;

        grid.cells.push([frame]);
    });

    var targetNumFrames = sampleInfo[1] - sampleInfo[0] + 1;
    for (var i = frames.length; i < targetNumFrames; i++) {
        grid.cells.push([Cell.create()]); // TODO: will this work?
    }

    grid.numFrames = targetNumFrames;

    return grid;
});

var fillFrames = function (cell, frames, startFrame, endFrame) {
    __stats.transform_numCellsSampling += 1;
    var atFrame = 0;
    var r = cell.grid.cells[0].length - 1;
    for (var c = 0; c < cell.grid.cells.length; c++) {
        var subCell = cell.grid.cells[c][r];
        var subEnd = atFrame + subCell.grid.numFrames - 1;
        if (atFrame <= endFrame && subEnd >= startFrame) {
            if (subCell.grid.numFrames === 1) {
                __stats.transform_numCellsSampling += 1;
                Execute.transformCell(cell.grid, subCell, c, r);
                frames.push(subCell);
            } else {
                var newStart = startFrame - atFrame;
                var newEnd = endFrame - atFrame;
                fillFrames(subCell, frames, newStart, newEnd);
            }
        }
        atFrame = subEnd + 1;
    }
};

})();
