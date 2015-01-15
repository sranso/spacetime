var stepsX = 240;
var stepsTextX = 50;
var lineHeight = 35;
var stepW = 400;
var historyWidth = 20;
var selectionInfoWidth = 32;

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

var drawSetup = function () {
    drawOverallSetup();
    drawStepsSetup();
    drawSelectionHistorySetup();
    drawSelectionInfoSetup();
    drawGroupsSetup();
};

var drawOverallSetup = function() {
    svg = d3.select('svg#code')
        .attr('width', '100%')
        .attr('height', '2000px') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', mouseMove)
        .on('mousedown', mouseDown) ;

    d3.select(document)
        .on('keydown', function () { inputEvent(keyForEvent(), 'down') })
        .on('keyup', function () { inputEvent(keyForEvent(), 'up') })
        .on('keypress', function () { keypressEvent(d3.event.keyCode) })
        .on('mouseup', mouseUp) ;

    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;
};

var update = function () {
    computeSteps();
    computePseudoSteps();
    computePositions();
    draw();
    fixUnder();
};

var computePositions = function () {
    computeStepPositions(allPseudoSteps);
    computeSelectionHistoryPositions();
    computeGroupPositions(allGroups);
};

var draw = function () {
    drawSteps(allPseudoSteps);
    drawSelectionHistory();
    drawSelectionInfo();
    drawGroups(__stretches);
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
        stepTextInput.select('input').node().blur();
    }
    under = newUnder;

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
    {text: '^ * 3'},
    {text: '^ - 12'},
    {text: 'square width:50 x:100 y:150'},
    {text: '3 + 5'},
    {text: 'square width:50 x:100 y:150'},
    {text: 'square width:100 x:100 y:150'},
    {text: '4 + 1'},
    {text: '^ * 3'},
    {text: '^ - 12'},
    {text: 'square width:50 x:100 y:150'},
    {text: '3 + 5'},
    {text: 'square width:50 x:100 y:150'},
    {text: 'square width:100 x:100 y:150'},
    {text: '4 + 1'},
    {text: '^ * 3'},
    {text: '^ - 12'},
    {text: 'square width:50 x:100 y:150'},
    {text: '3 + 5'},
    {text: 'square width:50 x:100 y:150'},
    {text: 'square width:100 x:100 y:150'},
], createStep);

linkSteps(allSteps);
allStepsLinkedList.next = allSteps[0];

dvorak();
drawSetup();
update();
