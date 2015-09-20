'use strict';
var Project = {};
(function () {

Project.create = function () {
    return {
        grid: Grid.none,
        cell: Cell.none,
        transformationTick: 1,
        executionTick: 1,
    };
};

Project.none = Project.create();

Project.createBlank = function () {
    var project = Project.create();
    project.grid = Grid.create();

    //======== BEGIN (Cell) ==========
    var historyCell = Cell.create();
    historyCell.grid = project.grid;
        // historyCell.group = Group.none;
    historyCell.transformation = Transformation.detached;
        // historyCell.operation = cell.operation;
        // historyCell.args = Cell.noArgs;
        // historyCell.text = '';
        // historyCell.gridTick = 0;
    historyCell.detached = true;
    historyCell.apply = true;
        // historyCell.base = false;
    //======== END (Cell) ==========

    //======== BEGIN (Cell) ==========
    project.cell = Cell.create();
    project.cell.grid = Grid.create();
        // project.cell.group = Group.none;
    project.cell.transformation = Transformation.detached;
        // project.cell.operation = cell.operation;
        // project.cell.args = Cell.noArgs;
        // project.cell.text = '';
        // project.cell.gridTick = 0;
    project.cell.detached = true;
        // project.cell.apply = false;
        // project.cell.base = false;
    //======== END (Cell) ==========

    project.cell.grid.layer = 'history';
    project.cell.grid.cells.push([historyCell]);

    return project;
};

})();
