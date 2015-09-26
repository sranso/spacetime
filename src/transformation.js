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
    baseCell.base = true;
    //========= END (Cell) ========

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
            sampleCell.transformation = sampleTransformation
                // sampleCell.operation = cell.operation;
            sampleCell.args = Cell.autoArgs[2];
            sampleCell.text = 'sample';
                // sampleCell.gridTick = 0;
                // sampleCell.detached = false;
                // sampleCell.base = false;
            //======== END (Cell) ==========

            layer.push(sampleCell);

            //======== BEGIN (Cell) ==========
            var cell = Cell.create();
            cell.grid = Grid.create();
                // cell.group = Group.none; TODO: what group?
            cell.transformation = Transformation.detached;
                // cell.operation = cell.operation;
                // cell.args = Cell.noArgs;
            cell.text = 'sample';
                // cell.gridTick = 0;
            cell.detached = true;
                // cell.base = false;
            //======== END (Cell) ==========

            cell.grid.cells.push(layer);

            column.push(cell);
            Execute.transformCell(grid, cell, c, column.length - 1);
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
            // linearCell.base = false;
        //========= END (Cell) ==========

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
            // frame.base = false;
        //========= END (Cell) =========

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
