var trackContainer;
var trackHtml;
var trackSvg;
var selectionTextInput;
var selectionHistoryEl;
var selectionHistoryCursor;
var selectionInfoEl;

var mouse = [0, 0];
var under = null;
var allStepsLinkedList = {head: true, next: null, previous: null};
var allSteps = [];
var allPseudoSteps = [];
var isMouseDown = false;

var selection = createGroup();
var allGroups = [selection];
var __stretches = [];
var selectionHistory = [{selection: selection}];
var selectionHistoryI = 0;
var saveHistoryI = -1;
var __selectionHistoryAll = selectionHistory;
var selectionStart = null;
var selectionEnd = null;

var update = function () {
    computeSteps();
    executeSteps();
    computePseudoSteps();
    computePositions();
    draw();
    under = findUnderMouse();
};

var mouseDown = function () {
    isMouseDown = true;
};

var mouseUp = function () {
    isMouseDown = false;
};

var mouseMove = function () {
    mouse = d3.mouse(trackHtml.node());
    under = findUnderMouse();
    changeSelection();
};

var findUnderMouse = function () {
    return findFromCoordinates(mouse[0], mouse[1]);
};

var findFromCoordinates = function (x, y) {
    return _.find(allPseudoSteps, function (step) {
        if (step.y <= y && y < step.y + step.h) {
            return step.x <= x && x < step.x + step.w;
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
allStepsLinkedList.next = allSteps[0];

dvorak();
drawSetup();
update();
