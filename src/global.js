'use strict';
var Global = {};

Global.stepsHead = {head: true, next: null, previous: null};
Global.stepsTail = {tail: true, next: null, previous: null};
Global.steps = [];
Global.stepViews = [];
Global.hoverStepView = null;
Global.hoverResultStepView = null;
Global.inputStepView = null;
Global.connectStepView = null;
Global.inputReferenceIs = [];
Global.groups = [];
Global.active = null;
Global.selection = null;
Global.idSequence = 0;
Global.mouseX = 0;
Global.mouseY = 0;

// var selectionHistory = [{selection: Global.selection}];
// var selectionHistoryI = 0;
// var saveHistoryI = -1;
// var __selectionHistoryAll = selectionHistory;

