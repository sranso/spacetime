'use strict';
var Transformation = {};
(function () {

Transformation.create = function (text, transform) {
    return {
        text: text,
        transform: transform,
        operation: Operation.none,
        apply: false,
        data: 0,
    };
};

Transformation.clone = function (oldTransformation) {
    var transformation = Transformation.create(oldTransformation.text, oldTransformation.transform);
    transformation.operation = oldTransformation.operation;
    // transformation.apply = oldTransformation.apply;
    // transformation.data = oldTransformation.data;
    return transformation;
};

Transformation.immediate = function (operation) {
    var transformation = Transformation.create(operation.text, immediateTransform);
    transformation.operation = operation;
    return transformation;
};

var immediateTransform = function (cell, main, additional) {
    var grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';

    // TODO: immediate transformation with args.
    grid.cells[0] = [];

    var baseCell = Cell.create();
    baseCell.base = true;
    baseCell.group = cell.group;
    baseCell.text = cell.text;
    baseCell.operation = cell.transformation.operation;
    baseCell.transformation = Transformation.none;
    baseCell.args = Cell.autoArgs[cell.args.length];

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

    var sampleAt = 0;
    var sampleInfo = additional.map(function (argCell) {
    });

    var appliedMain = main.grid.cells[0][main.grid.cells[0].length - 1];
    appliedMain.grid.cells.forEach(function (oldColumn, c) {
        var column = oldColumn.slice();

        var r = column.length - 1;
        var subMain = column[column.length - 1];
        // additional.forEach(function (add

        var transformCell = Cell.create();
        transformCell.group = cell.group;
        transformCell.text = cell.text;
        if (subMain.base) {
            transformCell.base = true;
            transformCell.operation = cell.transformation.operation;
        }
        transformCell.transformation = Transformation.clone(cell.transformation);
        transformCell.transformation.data = cell.transformation.data;
        transformCell.transformation.apply = false;
        transformCell.args = Cell.autoArgs[cell.args.length];
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

Transformation.none = Transformation.create('none', function (cell, main, additional) {
    var grid = Grid.create();
    grid.cells[0] = cell.grid.cells[0].slice();
    grid.layer = 'under';

    var original = grid.cells[0].pop();
    var baseCell = Cell.clone(original);
    baseCell.base = true;
    baseCell.transformation = Transformation.none;

    grid.cells[0].push(baseCell);
    grid.numFrames = 1;

    return grid;
});

Transformation.detached = Transformation.create('detached', function (cell) {
    Execute.transformGrid(cell.grid);
    return cell.grid;
});
Transformation.detached.apply = true;

Transformation.sampleAtData = Transformation.create('sampleAtData', function (cell, main, additional) {
    var sampleInfo = cell.transformation.data;
    var samples = [];
    fillSamples(main, samples, 0, sampleInfo[0], sampleInfo[1]);

    var grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';
    samples.forEach(function (originalSample) {
        var sample = Cell.create();
        sample.grid = originalSample.grid;
        sample.transformation = Transformation.detached;
        grid.cells.push([sample]);
    });
});

})();
