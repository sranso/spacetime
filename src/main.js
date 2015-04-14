var allStepsHead = {head: true, next: null, previous: null};
var allStepsTail = {tail: true, next: null, previous: null};
var allSteps = [];
var allPseudoSteps = [];
var hoverStep = null;
var insertStep = null;
var insertReferences = [];
var targetResult = null;
var targetReference = null;

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

var maybeUpdate = function (cb) {
    var lastHoverStep = hoverStep;
    var lastTargetStep = targetStep();
    cb();
    if (
        targetStep() !== lastTargetStep ||
        hoverStep !== lastHoverStep
    ) {
        update();
    }
};

var targetStep = function () {
    return insertStep || hoverStep;
};

var mouseUp = function () {
    stopSelecting();
    update();
};

var mouseMove = function () {
    var mouse = d3.mouse(trackContainer.node());
    maybeUpdate(function () {
        hoverStep = findStepUnderMouse(mouse);
    });
    maybeChangeSelection(mouse);
};

var mouseDown = function () {
    window.getSelection().removeAllRanges();
    maybeUpdate(function () { insertStep = null });
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
    {text: ''},
], createStep);

linkSteps(allSteps);
allStepsHead.next = allSteps[0];
allStepsTail.previous = allSteps[0];

dvorak();
drawSetup();
update();
