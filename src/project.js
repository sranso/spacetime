'use strict';
var Project = {};
(function () {

Project.create = function () {
    return {
        cellLevels: [],
        currentLevel: 0,
        transformationTick: 1,
        executionTick: 1,
        showHistory: false,
    };
};

Project.none = Project.create();

Project.createBlank = function () {
    var project = Project.create();

    var historyCell = wrapFromAbovePart(project);
    project.currentLevel = 1;

    return project;
};

Project.openCell = function (project, cell, c, r) {
    var removeAt = project.currentLevel + 1;
    var toRemove = project.cellLevels.length - removeAt;
    var newLevel = [cell, c, r];
    project.cellLevels.splice(removeAt, toRemove, newLevel);
    project.currentLevel += 1;

    if (!project.showHistory && cell.grid.layer === 'history') {
        r = cell.grid.cells[0].length - 1;
        Project.openCell(project, cell.grid.cells[0][r], 0, r);
    }
};

Project.upLevel = function (project) {
    if (project.showHistory) {
        project.currentLevel -= 1;
    } else {
        project.currentLevel -= 2;
    }
    if (project.currentLevel < 1) {
        Project.wrapFromAbove(project);
    }
};

Project.downLevel = function (project) {
    if (project.showHistory) {
        project.currentLevel += 1;
    } else {
        project.currentLevel += 2;
    }
    if (project.currentLevel >= project.cellLevels.length) {
        project.currentLevel = project.cellLevels.length - 1;
    }
};

Project.wrapFromAbove = function (project) {
    var historyCell = wrapFromAbovePart(project);
    historyCell.grid.cells = [[project.cellLevels[2][0]]];
    project.currentLevel += 2;
};

var wrapFromAbovePart = function (project) {
    //======== BEGIN (Cell) ==========
    var historyCell = Cell.create();
    historyCell.grid = Grid.create();
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
    var topCell = Cell.create();
    topCell.grid = Grid.create();
        // topCell.group = Group.none;
    topCell.transformation = Transformation.detached;
        // topCell.operation = cell.operation;
        // topCell.args = Cell.noArgs;
        // topCell.text = '';
        // topCell.gridTick = 0;
    topCell.detached = true;
        // topCell.apply = false;
        // topCell.base = false;
    //======== END (Cell) ==========

    topCell.grid.layer = 'history';
    topCell.grid.cells.push([historyCell]);

    project.cellLevels.splice(0, 0,
        [topCell, 0, 0],
        [historyCell, 0, 0]
    );
    return historyCell;
};

})();
