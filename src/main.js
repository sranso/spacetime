var allStepsHead = {head: true, next: null, previous: null};
var allStepsTail = {tail: true, next: null, previous: null};
var allSteps = [];
var allPseudoSteps = [];
var targetStep = null;

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
    computeReferenceInfo();
    computeSelectionInfo();
    draw();
};

var mouseUp = function () {
    stopSelecting();
    update();
};

var mouseMove = function () {
    var mouse = d3.mouse(trackContainer.node());
    var lastTargetStep = targetStep;
    targetStep = findStepUnderMouse(mouse);
    maybeChangeSelection(mouse);
    if (targetStep !== lastTargetStep) {
        update();
    }
};

var mouseDown = function () {
    window.getSelection().removeAllRanges();
    var mouse = d3.mouse(trackContainer.node());
    maybeStartSelecting(mouse);
};

var findStepUnderMouse = function (mouse) {
    var x = mouse[0], y = mouse[1];
    var startX = trackHtml.node().offsetLeft;
    var endX = startX + trackHtml.node().offsetWidth;
    return _.find(allPseudoSteps, function (step) {
        var el = step.__el__;
        if (el.offsetTop <= y && y < el.offsetTop + el.offsetHeight) {
            return startX <= x && x < endX;
        }
        return false;
    });
};

allSteps = _.map([
    {text: '4 + 1'},
    {text: '. * 3'},
    {text: '. - 12'},
], createStep);

linkSteps(allSteps);
allStepsHead.next = allSteps[0];
allStepsTail.previous = allSteps[0];

dvorak();
drawSetup();
update();
