var camera, allStatements, mouse, textInput, under, groups, selection, selectionHistory, selectionStart, selectionEnd;

var statementsX = 160;
var statementsTextX = 50;
var lineHeight = 35;
var statementW = 400;

mouse = null;
under = null;
selection = {
    elements: [],
};
groups = [selection];
selectionHistory = [selection];
selectionStart = null;
selectionEnd = null;

var drawSetup = function () {
    var svg = d3.select('svg#code')
        .attr('width', '100%')
        .attr('height', '2000px') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', mouseMove) ;

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

    textInput = d3.select('#text-input')
        .style('left', (statementsX + statementsTextX + 23) + 'px') ;

    textInput.select('input')
        .style('width', (statementW - statementsTextX - 20) + 'px')
        .style('height', (lineHeight - 12) + 'px') ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', statementsX + 70)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', statementsX + statementW - 80)
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

    console.log(key);
    if (key === 'z') {
        var nextSelection = selectionHistory[_.indexOf(selectionHistory, selection) + 1];
        if (!nextSelection) {
            if (selection.elements.length) {
                nextSelection = {elements: []};
                selectionHistory.push(nextSelection);
            } else {
                nextSelection = selection;
            }
        }
        selection = nextSelection;
    } else if (key === 'a') {
        var nextSelection = selectionHistory[_.indexOf(selectionHistory, selection) - 1];
        if (nextSelection) {
            selection = nextSelection;
        }
    }
    draw(getDrawSelection());
};

var startSelection = function () {
    fixUnder();
    selectionStart = under;
    changeSelection();
};

var changeSelection = function () {
    if (!selectionStart) {
        return;
    }
    if (under) {
        selectionEnd = under;
    }
    var startI = _.indexOf(allStatements, selectionStart);
    var endI = _.indexOf(allStatements, selectionEnd);
    if (endI < startI) {
        var temp = startI;
        startI = endI;
        endI = temp;
    }
    selection.elements = allStatements.slice(startI, endI + 1);
    draw(getDrawSelection());
};

var stopSelection = function () {
    selectionStart = null;
    selectionEnd = null;
};

var computePositions = function (statements) {
    var prevPos = {x: 0, y: 0, w: 0, h: 0};
    _.each(statements, function (statement) {
        var pos = {
            x: statementsX,
            y: prevPos.y + lineHeight,
            w: statementW,
            h: lineHeight - 3,
        };
        statement.position = pos;
        _.extend(statement, pos);
        prevPos = pos;
    });
};

var draw = function (sel) {
    var statements = camera.selectAll('g.statement')
        .data(sel.statements) ;

    var statementsEnter = statements.enter().append('g')
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        })
        .each(function (d) {
            d.__el__ = this;
        }) ;

    statementsEnter.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;

    statementsEnter.append('text')
        .attr('y', 21)
        .attr('x', statementsTextX) ;

    statements
        .attr('class', function (d) {
            var classes = [];
            if (_.contains(selection.elements, d)) {
                classes.push('selection');
            }
            classes.push('statement');
            return classes.join(' ');
        }) ;

    statements.select('text')
        .text(_.property('text')) ;
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
        textInput.node().blur();
        under = newUnder;
    }

    if (under) {
        d3.select(under.__el__)
            .classed('under-input', true) ;
        textInput
            .style('top', (under.y + 32) + 'px')
            .style('display', 'block')
        textInput.select('input')
            .property('value', under.text) ;
    } else {
        textInput
            .style('display', 'none') ;
    }
};

var findUnderMouse = function () {
    return findFromCoordinates(mouse[0], mouse[1]);
};

var findFromCoordinates = function (x, y) {
    return _.find(allStatements, function (statement) {
        if (statement.y < y && y < statement.y + statement.h) {
            return statement.x < x && x < statement.x + statement.w;
        }
        return false;
    });
};

var getDrawSelection = function () {
    return {
        statements: allStatements,
    };
};

var createStatement = function (statement) {
    return _.extend({
        text: '',
        position: null,
        __el__: null,
    }, statement);
};

allStatements = _.map([
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
], createStatement);

var keyMap = {8: 'backspace', 9: 'tab', 13: 'enter', 16: 'shift', 17: 'ctrl', 18: 'alt', 19: 'pause/break', 20: 'caps lock', 27: 'escape', 32: 'space', 33: 'page up', 34: 'page down', 35: 'end', 36: 'home', 37: 'left arrow', 38: 'up arrow', 39: 'right arrow', 40: 'down arrow', 45: 'insert', 46: 'delete', 48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9', 65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z', 91: 'left window key', 92: 'right window key', 93: 'select key', 96: 'numpad 0', 97: 'numpad 1', 98: 'numpad 2', 99: 'numpad 3', 100: 'numpad 4', 101: 'numpad 5', 102: 'numpad 6', 103: 'numpad 7', 104: 'numpad 8', 105: 'numpad 9', 106: 'multiply', 107: 'add', 109: 'subtract', 110: 'decimal point', 111: 'divide', 112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12', 144: 'num lock', 145: 'scroll lock', 186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: "'"};

var qwertyKeypressMap = {
    'q': 'q',
    'w': 'w',
    'e': 'e',
    'r': 'r',
    't': 't',
    'a': 'a',
    's': 's',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'z': 'z',
    'x': 'x',
    'c': 'c',
    'v': 'v',
    'b': 'b',
};

var dvorakKeypressMap = {
    "'": 'q',
    ',': 'w',
    '.': 'e',
    'p': 'r',
    'y': 't',
    'a': 'a',
    'o': 's',
    'e': 'd',
    'u': 'f',
    'i': 'g',
    ';': 'z',
    'q': 'x',
    'j': 'c',
    'k': 'v',
    'x': 'b',
};

var keypressMap;

var dvorak = function () {
    keypressMap = dvorakKeypressMap;
};

var qwerty = function () {
    keypressMap = qwertyKeypressMap;
};

dvorak();
drawSetup();
computePositions(allStatements);
draw(getDrawSelection());
