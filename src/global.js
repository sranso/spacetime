'use strict';
var $Project = Project.none;

var Global = {};

Global.currentInput = Input.create();
Global.capturedInput = Global.currentInput;
Global.play = false;
Global.forceCaptureInput = false;
Global.timePerFrame = 1000; // (1000 / 60) for 60fps;
Global.tickTimeAccrued = 0;
Global.lastTickTime = 0;
Global.framesToAdvance = 0;

Global.targetCellView = null;
Global.targetCellArg = 0;
Global.inputCell = false;
Global.cellEls = [];

var __stats = {
    transform_numCells: 0,
    transform_time: 0,

    execCell_numCells: 0,
    execCell_numBaseCells: 0,
    execCell_time: 0,

    execGrid_numCells: 0,
    execGrid_numBaseCells: 0,
    execGrid_time: 0,

    draw_time: 0,
};
