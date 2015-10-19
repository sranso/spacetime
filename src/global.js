'use strict';
var $Project = Project.none;

var Global = {};

Global.currentInput = Input.create();
Global.capturedInput = Global.currentInput;
Global.play = false;
Global.wasPlaying = false;
Global.forceCaptureInput = false;
Global.timePerFrame = 200; // (1000 / 60) for 60fps;
Global.tickTimeAccrued = 0;
Global.lastTickTime = 0;
Global.framesToAdvance = 0;

Global.fullScreen = false;
Global.targetCellView = null;
Global.targetCellArg = 0;
Global.inputCell = false;
Global.cellEls = [];
Global.boxInSight = null;
Global.lastScrollTop = 0;
Global.lastScrollLeft = 0;
Global.drawTick = 0;

Global.mouseDownOnPlayBar = false;

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
