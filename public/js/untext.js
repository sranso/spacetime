var stepsX = 240;
var stepsTextX = 50;
var lineHeight = 35;
var stepW = 400;
var historyWidth = 20;
var selectionInfoWidth = 32;

var camera;
var stepTextInput;
var selectionTextInput;
var selectionHistoryEl;
var selectionHistoryCursor;
var selectionInfoEl;

var mouse = [0, 0];
var under = null;
var allSteps = [];
var allPseudoSteps = [];

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
    var svg = d3.select('svg#code')
        .attr('width', '100%')
        .attr('height', '2000px') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', mouseMove) ;

    selectionHistoryEl = svg.append('g')
        .classed('selection-history', true)
        .attr('transform', 'translate(600,200)') ;

    selectionHistoryCursor = selectionHistoryEl.append('rect')
        .classed('selection-cursor', true)
        .attr('x', 1)
        .attr('y', 1)
        .attr('width', historyWidth - 2)
        .attr('height', historyWidth - 2) ;

    selectionInfoEl = svg.append('g')
        .classed('selection-info', true)
        .attr('transform', 'translate(850,300)') ;

    selectionInfoEl.append('rect')
        .classed('selection-cursor', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', selectionInfoWidth)
        .attr('height', selectionInfoWidth) ;

    selectionInfoEl.append('rect')
        .classed('selection-color', true)
        .attr('x', 2)
        .attr('y', 2)
        .attr('width', selectionInfoWidth - 4)
        .attr('height', selectionInfoWidth - 4) ;

    selectionTextInput = d3.select('#selection-text-input')
        .style('left', '930px')
        .style('top', '327px') ;

    selectionTextInput.select('input')
        .property('placeholder', 'Group name') ;

    d3.select(document)
        .on('keydown', function () { inputEvent(keyForEvent(), 'down') })
        .on('keyup', function () { inputEvent(keyForEvent(), 'up') })
        .on('keypress', function () { keypressEvent(d3.event.keyCode) }) ;

    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;

    stepTextInput = d3.select('#step-text-input')
        .style('left', (stepsX + stepsTextX + 23) + 'px') ;

    stepTextInput.select('input')
        .style('width', (stepW - stepsTextX - 20) + 'px')
        .style('height', (lineHeight - 12) + 'px') ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', stepsX + 70)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', stepsX + stepW - 80)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;
};

var keyForEvent = function () {
    return keyMap[d3.event.keyCode];
};

var inputEvent = function (key, eventType) {
    if (key === '\\') {
        debugger;
        return;
    }
    if (key === 'tab' && eventType === 'down') {
        d3.event.preventDefault();
        keypressEvent(null, 'tab');
        return;
    }

    if (key === 'shift' || key === 'ctrl') {
        if (eventType === 'down') {
            startSelection();
        } else {
            stopSelection();
        }
    }
};

var keypressEvent = function (keyCode, key) {
    key = key || String.fromCharCode(keyCode);
    if (keyCode === 13) {
        key = 'enter';
    }

    key = keypressMap[key] || key;

    if (key === 'd' || key === 's') {
        browseSelectionHistory(key === 'd');
    } else if (key === 'tab') {
        toggleExpanded();
    }

    update();
};

var update = function () {
    computePseudoSteps();
    computePositions();
    draw();
    fixUnder();
};

var computePositions = function () {
    computeStepPositions(allPseudoSteps);
    computeSelectionHistoryPositions();
    //computeGroupPositions(allGroups);
};

var draw = function () {
    drawSteps(allPseudoSteps);
    drawSelectionHistory();
    drawSelectionInfo();
    //drawGroups(__stretches);
};

var mouseMove = function () {
    mouse = d3.mouse(camera.node());
    fixUnder();
    changeSelection();
};

var fixUnder = function () {
    var newUnder = findUnderMouse();
    if (newUnder !== under) {
        if (under) {
            d3.select(under.__el__)
                .classed('under-input', false) ;
        }
        stepTextInput.node().blur();
        under = newUnder;
    }

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

var linkSteps = function (steps) {
    var previous = null;
    _.each(steps, function (step) {
        if (previous) {
            previous.next = step;
        }
        step.previous = previous;
        previous = step;
    });
};

linkSteps(allSteps);
linkSteps(allPseudoSteps);

var keyMap = {8: 'backspace', 9: 'tab', 13: 'enter', 16: 'shift', 17: 'ctrl', 18: 'alt', 19: 'pause/break', 20: 'caps lock', 27: 'escape', 32: 'space', 33: 'page up', 34: 'page down', 35: 'end', 36: 'home', 37: 'left arrow', 38: 'up arrow', 39: 'right arrow', 40: 'down arrow', 45: 'insert', 46: 'delete', 48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9', 65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z', 91: 'left window key', 92: 'right window key', 93: 'select key', 96: 'numpad 0', 97: 'numpad 1', 98: 'numpad 2', 99: 'numpad 3', 100: 'numpad 4', 101: 'numpad 5', 102: 'numpad 6', 103: 'numpad 7', 104: 'numpad 8', 105: 'numpad 9', 106: 'multiply', 107: 'add', 109: 'subtract', 110: 'decimal point', 111: 'divide', 112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12', 144: 'num lock', 145: 'scroll lock', 186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: "'"};

var qwertyKeypressMap = { 'q': 'q', 'w': 'w', 'e': 'e', 'r': 'r', 't': 't', 'a': 'a', 's': 's', 'd': 'd', 'f': 'f', 'g': 'g', 'z': 'z', 'x': 'x', 'c': 'c', 'v': 'v', 'b': 'b'};

var dvorakKeypressMap = { "'": 'q', ',': 'w', '.': 'e', 'p': 'r', 'y': 't', 'a': 'a', 'o': 's', 'e': 'd', 'u': 'f', 'i': 'g', ';': 'z', 'q': 'x', 'j': 'c', 'k': 'v', 'x': 'b'};

var keypressMap;

var dvorak = function () {
    keypressMap = dvorakKeypressMap;
};

var qwerty = function () {
    keypressMap = qwertyKeypressMap;
};

dvorak();
drawSetup();
update();
