'use strict';
var Global = {};

Global.grid = Grid.create();
Global.transformationTick = 1;
Global.stats = {
    numCellsExecuteAll: 0,
    numCellsTransformed: 0,
    numCellsTouchedSampling: 0,
};
