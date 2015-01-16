var svg;
var camera;
var stepTextInput;
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
    fixUnder();
};

var mouseDown = function () {
    isMouseDown = true;
};

var mouseUp = function () {
    isMouseDown = false;
};

var mouseMove = function () {
    mouse = d3.mouse(camera.node());
    fixUnder();
    changeSelection();
};

var fixUnder = function () {
    var newUnder = findUnderMouse();
    var underEntity = under && under.entity;
    var newEntity = newUnder && newUnder.entity;
    if (newEntity != underEntity) {
        if (under) {
            d3.select(under.__el__)
                .classed('under-input', false) ;
        }
    }
    under = newUnder;
    if (newEntity != underEntity) {
        stepTextInput.select('input').node().blur();

        if (under) {
            d3.select(under.__el__)
                .classed('under-input', true) ;
            stepTextInput
                .style('top', (under.y + 32) + 'px')
                .style('display', 'block')
            stepTextInput.select('input')
                .property('value', under.text) ;
        } else {
            stepTextInput
                .style('display', 'none') ;
        }
    }
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
    {text: '5 * 3'},
    {text: '15 - 12'},
    {text: '3 + 5'},
    {text: '4 + 1'},
    {text: '5 * 3'},
    {text: '15 - 12'},
    {text: '3 + 5'},
    {text: '4 + 1'},
    {text: '5 * 3'},
    {text: '15 - 12'},
    {text: '3 + 5'},
    {text: '4 + 1'},
    {text: '5 * 3'},
    {text: '15 - 12'},
    {text: '3 + 5'},
], createStep);

linkSteps(allSteps);
allStepsLinkedList.next = allSteps[0];

dvorak();
drawSetup();
update();
