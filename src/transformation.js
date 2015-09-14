'use strict';
var Transformation = {};
(function () {

Transformation.create = function (text, transform) {
    return {
        text: text,
        transform: transform,
        apply: false,
    };
};

Transformation.none = Transformation.create('none', function (cell, main, additional) {
    var grid = Grid.create();
    grid.cells = [];
    grid.layer = 'under';
    if (main) {
        grid.cells[0] = main.grid.cells[0].slice();
    } else {
        grid.cells[0] = [];
    }

    var baseCell = Cell.create();
    baseCell.base = true;
    baseCell.group = cell.group;
    baseCell.text = cell.text;
    baseCell.operation = cell.operation;
    baseCell.transformation = Transformation.none;
    var args = [];
    var j = -cell.args.length / 2;
    for (var i = 0; i < cell.args.length; i += 2) {
        args[i] = 0;
        args[i + 1] = j;
        j++;
    }
    baseCell.args = args;

    grid.cells[0].push(baseCell);

    return grid;
});

Transformation.detached = Transformation.create('detached', function (cell) {
    return cell.grid;
});

var immediate = function (operation) {
    return Transformation.create(operation.text, function (cell, main, additional) {
        var grid = Grid.create();
        grid.cells = [];
        grid.layer = 'under';
        if (main) {
            grid.cells[0] = main.grid.cells[0].slice();
        } else {
            grid.cells[0] = [];
        }

        var baseCell = Cell.create();
        baseCell.base = true;
        baseCell.group = cell.group;
        baseCell.text = cell.text;
        baseCell.operation = operation;
        baseCell.transformation = Transformation.none;
        var args = [];
        var j = -cell.args.length / 2;
        for (var i = 0; i < cell.args.length; i += 2) {
            args[i] = 0;
            args[i + 1] = j;
            j++;
        }
        baseCell.args = args;

        grid.cells[0].push(baseCell);

        return grid;
    });
};


var linear = function (operation) {
    var transformation = Transformation.create(operation.text, function (cell, main, additional) {
        var grid = Grid.create();
        grid.cells = [];
        grid.layer = 'under';

        if (main) {
            var nextMain = main.grid.cells[0][main.grid.cells.length - 1];
        }
        if (!main || nextMain.base) {
            if (main) {
                grid.cells[0] = main.grid.cells[0].slice();
            } else {
                grid.cells[0] = [];
            }

            var baseCell = Cell.create();
            baseCell.base = true;
            baseCell.group = cell.group;
            baseCell.text = cell.text;
            baseCell.operation = operation;
            baseCell.transformation = cell.transformation;
            var args = [];
            var j = -cell.args.length / 2;
            for (var i = 0; i < cell.args.length; i += 2) {
                args[i] = 0;
                args[i + 1] = j;
                j++;
            }
            baseCell.args = args;

            grid.cells[0].push(baseCell);
        } else {
            main.grid.cells.forEach(function (oldColumn, c) {
                var column = oldColumn.slice();

                var transformCell = Cell.create();
                transformCell.group = cell.group;
                transformCell.text = cell.text;
                transformCell.transformation = cell.transformation;
                var args = [];
                var j = -cell.args.length / 2;
                for (var i = 0; i < cell.args.length; i += 2) {
                    args[i] = 0;
                    args[i + 1] = j;
                    j++;
                }
                transformCell.args = args;
                column.push(transformCell);

                grid.cells.push(column);

                Execute.transformCell(grid, transformCell, c, column.length - 1);
            });

            Execute.transformGrid(grid);
        }

        return grid;
    });

    return transformation;
};

Transformation.add = linear(Operation.add);
Transformation.plusOne = linear(Operation.plusOne);
Transformation.double = linear(Operation.double);

Transformation.literal = immediate(Operation.literal);

})();
