'use strict';
var Global = {};

Global.stepsHead = {head: true, next: null, previous: null};
Global.stepsTail = {tail: true, next: null, previous: null};
Global.steps = [];
Global.stepViews = [];
Global.hoverStepView = null;
Global.insertStepView = null;
Global.insertReferenceIs = [];
Global.groups = [];
Global.active = null;
Global.selection = null;
Global.idSequence = 0;

// var selectionHistory = [{selection: Global.selection}];
// var selectionHistoryI = 0;
// var saveHistoryI = -1;
// var __selectionHistoryAll = selectionHistory;

