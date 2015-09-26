'use strict';
var Project = {};
(function () {

Project.create = function () {
    return {
        cellLevels: [],
        currentLevel: 0,
        transformationTick: 1,
        executionTick: 1,
    };
};

Project.none = Project.create();

Project.createBlank = function () {
    var project = Project.create();
    wrapFromAbovePart(project);

    return project;
};

Project.openCell = function (project, cell, c, r) {
    var removeAt = project.currentLevel + 1;
    var toRemove = project.cellLevels.length - removeAt;
    var newLevel = [cell, c, r];
    project.cellLevels.splice(removeAt, toRemove, newLevel);
    project.currentLevel += 1;
};

Project.outLevel = function (project) {
    project.currentLevel -= 1;
    if (project.currentLevel < 0) {
        Project.wrapFromAbove(project);
    }
};

Project.intoLevel = function (project) {
    project.currentLevel += 1;
    if (project.currentLevel >= project.cellLevels.length) {
        project.currentLevel = project.cellLevels.length - 1;
    }
};

Project.wrapFromAbove = function (project) {
    var cell = wrapFromAbovePart(project);
    cell.grid.cells = [[project.cellLevels[1][0]]];
    project.currentLevel += 1;
};

var wrapFromAbovePart = function (project) {
    //======== BEGIN (Cell) ==========
    var cell = Cell.create();
    cell.grid = Grid.create();
        // cell.group = Group.none;
    cell.transformation = Transformation.detached;
        // cell.operation = cell.operation;
        // cell.args = Cell.noArgs;
        // cell.text = '';
        // cell.gridTick = 0;
    cell.detached = true;
        // cell.base = false;
    //======== END (Cell) ==========

    project.cellLevels.splice(0, 0,
        [cell, 0, 0]
    );
    return cell;
};

})();
