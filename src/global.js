'use strict';
var Global = {};

Global.grid = Grid.create();
Global.cell = Cell.create();
Global.frames = [];
Global.transformationTick = 1;
Global.executionTick = 1;
Global.stats = {
    numCellsTransformed: 0,
    numCellsTouchedSampling: 0,
    numCellsExecuteAll: 0,
    numCellsExecute: 0,
    numBaseCellsExecute: 0,
};
