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

        //========= BEGIN (Cell) =======
        var mainClone = Cell.create();
            mainClone.grid = main.grid;
            mainClone.group = main.group;
            mainClone.transformation = main.transformation;
            mainClone.operation = main.operation;
        mainClone.args = Cell.autoArgs[main.args.length];
            mainClone.text = main.text;
        mainClone.gridTick = $Project.transformationTick;
        mainClone.detached = main.transformation === Transformation.detached;
            // mainClone.apply = false;
            mainClone.base = main.base;
        //========= END (Cell) =======

        layer.push(mainClone);
    } else {
        var layer = [];
    }

    additional.forEach(function (original) {

        //========= BEGIN (Cell) ========
        var argCell = Cell.create();
            argCell.grid = original.grid;
            argCell.group = original.group;
            argCell.transformation = original.transformation;
            argCell.operation = original.operation;
            argCell.args = original.args;
            argCell.text = original.text;
        argCell.gridTick = $Project.transformationTick;
        argCell.detached = true;
            // argCell.apply = false;
            argCell.base = original.base;
        //========= END (Cell) ========

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

    //======== BEGIN (Cell) ========
    var baseCell = Cell.create();
        // baseCell.grid = Grid.none;
        baseCell.group = cell.group;
        baseCell.transformation = cell.transformation;
    baseCell.operation = cell.transformation.operation;
        baseCell.args = cell.args;
        baseCell.text = cell.text;
        // baseCell.gridTick = 0;
        // baseCell.detached = false;
        // baseCell.apply = false;
    baseCell.base = true;
    //========= END (Cell) ========

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

    var atFrame = 0;
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

    var applyingMain = main.grid.cells[0][main.grid.cells[0].length - 1];
    applyingMain.grid.cells.forEach(function (oldColumn, c) {
        var column = oldColumn.slice();

        var r = column.length - 1;
        var subMain = column[column.length - 1];
        sampleInfo.forEach(function (info) {
            var argCell = info.cell;
            var argFrameStart = atFrame + info.start;
            var argFrameEnd = argFrameStart + subMain.grid.numFrames - 1;

            var layer = basicStartOfTransform(argCell, Cell.noArgs);

            //======== BEGIN (Transformation) =====
            var sampleTransformation = Transformation.create(
                Transformation.sampleAtData.text,
                Transformation.sampleAtData.transform
            );
            // sampleCell.transformation.operation = Operation.none
            sampleTransformation.data = [argFrameStart, argFrameEnd];
            //======== END (Transformation) =====

            //======== BEGIN (Cell) ==========
            var sampleCell = Cell.create();
                // sampleCell.grid = Grid.none;
                // sampleCell.group = Group.none; TODO: what group?
            sampleCell.transformation = sampleTransformation;
                // sampleCell.operation = cell.operation;
            sampleCell.args = Cell.autoArgs[2];
                // sampleCell.text = '';  TODO: what text?
                // sampleCell.gridTick = 0;
                // sampleCell.detached = false;
            sampleCell.apply = true;
                // sampleCell.base = false;
            //======== END (Cell) ==========

            layer.push(sampleCell);

            //======== BEGIN (Cell) ==========
            var historyCell = Cell.create();
            historyCell.grid = Grid.create();
                // historyCell.group = Group.none; TODO: what group?
            historyCell.transformation = Transformation.detached;
                // historyCell.operation = cell.operation;
                // historyCell.args = Cell.noArgs;
                // historyCell.text = '';  TODO: what text?
            historyCell.gridTick = $Project.transformationTick;
            historyCell.detached = true;
                // historyCell.apply = false;
                // historyCell.base = false;
            //======== END (Cell) ==========

            historyCell.grid.layer = 'history';
            historyCell.grid.cells.push(layer);

            var r = layer.length - 1;
            Execute.transformCell(historyCell.grid, sampleCell, 0, r);

            column.push(historyCell);
        });

        atFrame += subMain.grid.numFrames;

        //========= BEGIN (Cell) ==========
        var linearCell = Cell.create();
            // linearCell.grid = Grid.none;
            linearCell.group = cell.group;
            linearCell.transformation = cell.transformation;
            // linearCell.operation = Operation.none;
        linearCell.args = Cell.autoArgs[cell.args.length];
            linearCell.text = cell.text;
            // linearCell.gridTick = 0;
            // linearCell.detached = false;
            // linearCell.apply = false;
            // linearCell.base = false;
        //========= END (Cell) ==========

        if (subMain.grid.numFrames === 1) {
            linearCell.base = true;
            linearCell.operation = cell.transformation.operation;
        }
        column.push(linearCell);


        grid.cells.push(column);

        if (subMain.grid.numFrames === 1) {
            grid.numFrames += 1;
        } else {
            Execute.transformCell(grid, linearCell, c, column.length - 1);
            grid.numFrames += linearCell.grid.numFrames;
        }
    });

    return grid;
};


Transformation.add = Transformation.linear(Operation.add);
Transformation.plusOne = Transformation.linear(Operation.plusOne);
Transformation.double = Transformation.linear(Operation.double);

Transformation.literal = Transformation.immediate(Operation.literal);

Transformation.none = Transformation.create('none', function () {
    throw new Error('illegal Transformation.none used');
});

Transformation.detached = Transformation.create('detached', function (cell) {
    Execute.transformGrid(cell.grid);
    return cell.grid;
});

Transformation.history = Transformation.create('history', function (cell, main, additional) {
    var grid = Grid.create();
    grid.layer = 'history';
    grid.cells[0] = basicStartOfTransform(main, additional);

    if (cell.grid === Grid.none) {

        //========= BEGIN (Cell) ==========
        var historyCell = Cell.create();
            // historyCell.grid = Grid.none;
            historyCell.group = cell.group;
            historyCell.transformation = cell.transformation;
            // historyCell.operation = Operation.none;
            // historyCell.args = Cell.noArgs; // set below
            historyCell.text = cell.text;
            // historyCell.gridTick = 0;
            // historyCell.detached = false;
        historyCell.apply = true;
            // historyCell.base = false;
        //========= END (Cell) ==========

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
    frames.forEach(function (original) {
        //========= BEGIN (Cell) =========
        var frame = Cell.create();
            frame.grid = original.grid;
            frame.group = original.group;
        frame.transformation = Transformation.detached;
            // frame.operation = Operation.none;
            // frame.args = Cell.noArgs;
            frame.text = original.text;
        frame.gridTick = $Project.transformationTick;
        frame.detached = true;
            // frame.apply = false;
            // frame.base = false;
        //========= END (Cell) =========

        grid.cells.push([frame]);
    });

    var targetNumFrames = sampleInfo[1] - sampleInfo[0];
    for (var i = frames.length; i < targetNumFrames; i++) {
        grid.cells.push([Cell.create()]); // TODO: will this work?
    }

    return grid;
});

var fillFrames = function (cell, frames, startFrame, endFrame) {
    $_stats.transform_numCellsSampling += 1;
    var atFrame = 0;
    var applyingCell = cell.grid.cells[0][cell.grid.cells[0].length - 1];
    var r = applyingCell.grid.cells[0].length - 1;
    for (var c = 0; c < applyingCell.grid.cells.length; c++) {
        var subCell = applyingCell.grid.cells[c][r];
        var subEnd = atFrame + subCell.grid.numFrames - 1;
        if (atFrame <= endFrame && subEnd >= startFrame) {
            if (subCell.grid.numFrames === 1) {
                $_stats.transform_numCellsSampling += 1;
                Execute.transformCell(applyingCell.grid, subCell, c, r);
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
