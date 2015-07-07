'use strict';
var Global = {};

Global.stepsHead = {head: true, next: null, previous: null};
Global.stepsTail = {tail: true, next: null, previous: null};
Global.steps = [];
Global.__series = [];
Global.stepViews = [];
Global.hoverStepView = null;
Global.hoverResultStepView = null;
Global.hoverMatchesStepView = null;
Global.hoverIndexStretch = null;
Global.inputStepView = null;
Global.inputForegroundIndexStretch = null;
Global.connectStepView = null;
Global.inputReferenceIs = [];
Global.groups = [];
Global.active = null;
Global.__activeSteps = null;
Global.selection = null;
Global.idSequence = 0;
Global.mouseX = null;
Global.mouseY = null;
Global.lastQuads = null;
Global.canvasFullWidth = 640;
Global.canvasFullHeight = 400;

// var selectionHistory = [{selection: Global.selection}];
// var selectionHistoryI = 0;
// var saveHistoryI = -1;
// var __selectionHistoryAll = selectionHistory;

