var allStepsHead = {head: true, next: null, previous: null};
var allStepsTail = {tail: true, next: null, previous: null};
var allSteps = [];
var allPseudoSteps = [];

var allGroups = [];
var __stretches = [];
var __active = createGroup({hidden: true});
// var selectionHistory = [{selection: selection}];
// var selectionHistoryI = 0;
// var saveHistoryI = -1;
// var __selectionHistoryAll = selectionHistory;

var update = function () {
    computeSteps();
    executeSteps();
    computeActive();
    computePseudoSteps();
    computeSelectionInfo();
    computePositions();
    draw();
};

var mouseUp = function () {
    stopSelecting();
};

var mouseMove = function () {
    var mouse = d3.mouse(trackHtml.node());
    maybeChangeSelection(mouse);
};

var mouseDown = function () {
    var mouse = d3.mouse(trackHtml.node());
    maybeStartSelecting(mouse);
};

allSteps = _.map([
    {text: '4 + 1'},
    {text: '. * 3'},
    {text: '. - 12'},
], createStep);

linkSteps(allSteps);
allStepsHead.next = allSteps[0];
allStepsTail.previous = allSteps[0];

setupInput();
drawSetup();
update();
