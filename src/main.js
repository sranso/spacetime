var svg;
var camera;
var stepTextInput;
var selectionTextInput;
var selectionHistoryEl;
var selectionHistoryCursor;
var selectionInfoEl;

var mouse = [0, 0];
var under = null;
var inserting = null;
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

var target = function () {
    return inserting || under;
};

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
    if (inserting) {
        inserting = null;
        under = null;
    }
    fixUnder();
    changeSelection();
};

var fixUnder = function () {
    if (inserting) {
        return;
    }
    var newUnder = findUnderMouse();
    var underEntity = under && under.entity;
    var newEntity = newUnder && newUnder.entity;
    under = newUnder;

    camera.selectAll('.under-input')
        .classed('under-input', false) ;

    if (under) {
        d3.select(under.__el__)
            .classed('under-input', true) ;
    }

    if (newEntity != underEntity) {
        stepTextInput.select('input').node().blur();

        if (under) {
            positionStepTextInput();

            setTextForStepTextInput();
        }
    }
};

var positionStepTextInput = function () {
    if (target()) {
        stepTextInput
            .style('top', (target().y + 32) + 'px')
            .style('display', 'block') ;
    } else {
        stepTextInput
            .style('display', 'none') ;
    }
}

var setTextForStepTextInput = function () {
    stepTextInput.select('input')
        .property('value', target().text) ;
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
