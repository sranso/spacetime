'use strict';
var $Project = Project.none;

var $Global = {};

$Global.frames = [];

var $Stats = {
    numCellsTransformed: 0,
    numCellsTouchedSampling: 0,

    numCellsExecuteAll: 0,
    timeExecuteAll: 0,

    numCellsExecute: 0,
    timeExecute: 0,
    numBaseCellsExecute: 0,

    numCellsExecuteGrid: 0,
    timeExecuteGrid: 0,
    numBaseCellsExecuteGrid: 0,
};
