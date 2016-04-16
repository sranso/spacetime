'use strict';
global.Project = {};
(function () {

Project.create = function () {
    return {
        cellLevels: [],
        currentLevel: 0,
        currentFrame: 0,
        transformationTick: 1,
        executionTick: 1,
    };
};

Project.none = Project.create();

Project.currentLevel = function (project) {
    return project.cellLevels[project.currentLevel];
};

Project.currentCell = function (project) {
    return project.cellLevels[project.currentLevel].cell;
};

Project.currentGrid = function (project) {
    return project.cellLevels[project.currentLevel].cell.grid;
};

Project.createBlank = function () {
    var project = Project.create();
    wrapFromAbovePart(project);

    return project;
};

Project.openCell = function (project, cell, grid, c, r) {
    var removeAt = project.currentLevel + 1;
    var toRemove = project.cellLevels.length - removeAt;
    var newLevel = {
        cell: cell,
        grid: grid,
        c: c,
        r: r,
    };
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
    if (project.currentLevel === 1) {
        maybeRemoveTop(project);
    }
};

Project.toLevel = function (project, level) {
    var previousLevel = project.currentLevel;
    if (level < 0) {
        Project.wrapFromAbove(project);
        project.currentLevel = 0;
    } else {
        project.currentLevel = level;
    }
    if (previousLevel < level) {
        maybeRemoveTop(project);
    }
};

var maybeRemoveTop = function (project) {
    while (project.currentLevel > 0) {
        var topCell = project.cellLevels[0].cell;
        var grid = topCell.grid;
        if (
            topCell.transformation === Transformation.empty &&
            grid.cells.length === 1 &&
            grid.cells[0].length === 1 &&
            grid.cells[0][0].transformation === Transformation.empty
        ) {
            project.cellLevels.splice(0, 1);
            project.currentLevel -= 1;
        } else {
            break;
        }
    }
};

Project.wrapFromAbove = function (project) {
    var cell = wrapFromAbovePart(project);
    var previousTopLevel = project.cellLevels[1];
    previousTopLevel.grid = cell.grid;
    cell.grid.cells = [[previousTopLevel.cell]];
    project.currentLevel += 1;
};

var wrapFromAbovePart = function (project) {
    var cell = Cell.create();
    cell.grid = Grid.create();
    cell.transformation = Transformation.empty;

    var grid = Grid.create();
    grid.cells = [[cell]];

    var topLevel = {
        cell: cell,
        grid: grid,
        c: 0,
        r: 0,
    };
    project.cellLevels.splice(0, 0, topLevel);

    return cell;
};

})();
