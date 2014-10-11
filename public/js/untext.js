//window.untext = (function () {

var BARRIER = 1;
var EMPTY = 2;
var width = '100%';
var height = 300;
var levelHeight = 26;
var gapWidth = 8;
var gapHeight = 6;
var minMoveX = 12;

var qwertyKeyMap = {
      8: 'backspace',
      9: 'tab',
     13: 'enter',
     16: 'shift',
     17: 'ctrl',
     18: 'alt',
     19: 'pause/break',
     20: 'caps lock',
     27: 'escape',
     33: 'page up',
     34: 'page down',
     35: 'end',
     36: 'home',
     37: 'left arrow',
     38: 'up arrow',
     39: 'right arrow',
     40: 'down arrow',
     45: 'insert',
     46: 'delete',
     48: '0',
     49: '1',
     50: '2',
     51: '3',
     52: '4',
     53: '5',
     54: '6',
     55: '7',
     56: '8',
     57: '9',
     65: 'A',
     66: 'B',
     67: 'C',
     68: 'D',
     69: 'E',
     70: 'F',
     71: 'G',
     72: 'H',
     73: 'I',
     74: 'J',
     75: 'K',
     76: 'L',
     77: 'M',
     78: 'N',
     79: 'O',
     80: 'P',
     81: 'Q',
     82: 'R',
     83: 'S',
     84: 'T',
     85: 'U',
     86: 'V',
     87: 'W',
     88: 'X',
     89: 'Y',
     90: 'Z',
     91: 'left window key',
     92: 'right window key',
     93: 'select key',
     96: 'numpad 0',
     97: 'numpad 1',
     98: 'numpad 2',
     99: 'numpad 3',
    100: 'numpad 4',
    101: 'numpad 5',
    102: 'numpad 6',
    103: 'numpad 7',
    104: 'numpad 8',
    105: 'numpad 9',
    106: 'multiply',
    107: 'add',
    109: 'subtract',
    110: 'decimal point',
    111: 'divide',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'num lock',
    145: 'scroll lock',
    186: ';',
    187: '=',
    188: ',',
    189: '-',
    190: '.',
    191: '/',
    192: '`',
    219: '[',
    220: '\\',
    221: ']',
    222: "'",
};

var dvorakKeyMap = _.extend({}, qwertyKeyMap, {
     65: 'A',
     88: 'B',
     74: 'C',
     69: 'D',
    190: 'E',
     85: 'F',
     73: 'G',
     68: 'H',
     67: 'I',
     72: 'J',
     84: 'K',
     78: 'L',
     77: 'M',
     66: 'N',
     82: 'O',
     76: 'P',
    222: 'Q',
     80: 'R',
     79: 'S',
     89: 'T',
     71: 'U',
     75: 'V',
    188: 'W',
     81: 'X',
     70: 'Y',
    186: 'Z',
     83: ';',
    221: '=',
     87: ',',
    219: '-',
     86: '.',
     90: '/',
    192: '`',
    191: '[',
    220: '\\',
    187: ']',
    189: "'",
});

var keyRemaps = {
    'default': {
        'B': 'left mouse',
    },
};

var keyMap = {
    qwerty: qwertyKeyMap,
    dvorak: dvorakKeyMap,
};

var keyAssignments = {
    startMoving: ['$down', '$:left mouse'],
    stopMoving: ['$up', '$:left mouse'],
    oppositeMoving: ['shift', 'left mouse'],
    oppositeMovingToggle: ['$:shift', 'shift', 'left mouse'],
    debug: ['$down', 'D'],
};


var untext, allSymbolTree, allSymbols, allBars, allTokens, symbolIdSequence, offCameraToken, camera,
    moving, hovering, mouse, keyboardLayout, keysDown, lastKeysDown;

var init = function () {
    untext = {};
    allSymbolTree = null;
    allSymbols = [];
    allBars = [];
    allTokens = [];
    symbolIdSequence = 0;
    moving = null;
    hovering = null;
    mouse = [0, 0];
    keyboardLayout = 'dvorak';
    keyRemap = 'default';
    keysDown = {'$firing': false, '$key': 'left mouse', '$down': false, '$up': false, '$:left mouse': true};
    lastKeysDown = keysDown;
};

//////

var keyForEvent = function () {
    var key = keyMap[keyboardLayout][d3.event.keyCode];
    var remapped = keyRemaps[keyRemap][key];
    return remapped == null ? key : remapped;
};

var inputEvent = function (key, eventType) {
    lastKeysDown = keysDown;
    var pressed = _.filter(_.pairs(lastKeysDown), function (p) {
        return p[1] && p[0][0] !== '$';
    })
    keysDown = _.object(pressed);
    keysDown['$' + eventType] = true;
    if (key) {
        keysDown['$:' + key] = true;
        keysDown[key] = eventType === 'down';
    }
    keysDown['$firing'] = true;

    if (active('startMoving')) {
        if (hovering) { startMoving(hovering) }
    } else if (active('stopMoving')) {
        stopMoving();
    } else if (active('debug')) {
        debugger;
    }
    if (toggled('oppositeMovingToggle')) {
        dragMoving(true);
    }

    keysDown['$firing'] = false;
};

var active = function (action, keys) {
    keys = keys || keysDown;
    var combo = keyAssignments[action];
    return _.every(combo, function (key) { return keys[key]; });
};

var triggered = function (action) {
    return active(action, keysDown) && !active(action, lastKeysDown);
};

var toggled = function (action) {
    return active(action, keysDown) != active(action, lastKeysDown);
};

var movingInfo = function () {
    var startMouse = moving.startMouse;
    var diff = [mouse[0] - startMouse[0], mouse[1] - startMouse[1]];
    return {
        diff: diff,
        direction: [diff[0] >= 0 ? 1 : -1, diff[1] >= 0 ? 1 : -1],
        absDiff: [Math.abs(diff[0]), Math.abs(diff[1])],
        mode: movingMode(),
    };
};

var movingMode = function () {
    if (!moving) {
        return '';
    }
    return moving.bar === active('oppositeMoving') ? 'token' : 'symbol';
};

var startMoving = function (s) {
    if (!moving) {
        moving = s;
        moving.startMouse = mouse;
        moving.startTime = Date.now();
        draw(movingSelection());
    }
};

var stopMoving = function (s) {
    if (moving) {
        moving = null;
        draw();
    }
};

var dragMoving = function (toggleMode) {
    if (!moving) {
        return;
    }

    var info = movingInfo();
    var moved;

    if (info.mode === 'token') {
        moved = dragToken(info);
    } else {
        moved = dragSymbol(info);
    }

    if (!moved && !toggleMode) {
        draw(movingSelection());
    } else {
        drawAfterMove(info);
    }
};

var drawAfterMove = function (info) {
    var currentPos = {x: moving.x, y: moving.y};
    computeStructure(info.mode);
    var sel = fullSelection();
    computePositions(sel);
    moving.startMouse = [
        moving.startMouse[0] + moving.x - currentPos.x,
        moving.startMouse[1] + moving.y - currentPos.y,
    ];
    computePositions(movingSelection());
    render(sel);
};

var dragToken = function (info) {
    var depths = dragDepth(info);
    moving.depth = depths[0];

    var swap = false;
    var diffX = info.absDiff[0];
    while (true) {
        var neighborI = moving.tokenI + info.direction[0];
        var neighborSymbol = allTokens[neighborI];
        if (neighborSymbol && diffX >= neighborSymbol.w / 2 && diffX > minMoveX) {
            swap = true;
            allTokens[moving.tokenI] = neighborSymbol;
            allTokens[neighborSymbol.tokenI] = moving;
            diffX -= neighborSymbol.w;
        } else {
            break;
        }
    }
    return moved = (depths[0] !== depths[1]) || swap;
};

var dragSymbol = function (info) {
    var depths = dragDepth(info);

    var siblings = moving.parent.children;
    var depthChange = depths[0] - depths[1];
    if (depthChange <= -1) {
        siblings.splice(moving.treeI, 1);
        var n = new Array(-depthChange);
        var insertBefore = _.reduce(n, _.property('parent'), moving);
        var newSiblings = insertBefore.parent.children;
        var before = newSiblings.slice(0, insertBefore.treeI);
        var after = newSiblings.slice(insertBefore.treeI);
        newSiblings = before.concat([moving]).concat(after);
        insertBefore.parent.children = newSiblings;
        drawAfterMove(info);
    } else if (depthChange >= 1) {
        var neighborI = moving.treeI + info.direction[0];
        var firstNeighbor = siblings[neighborI];
        neighborI = moving.treeI - info.direction[0];
        var secondNeighbor = siblings[neighborI];
        var descendNeighbor = _.find([firstNeighbor, secondNeighbor], function (n) {
            return n && n.bar;
        });
        if (descendNeighbor) {
            siblings.splice(moving.treeI, 1);
            if (descendNeighbor.treeI > moving.treeI) {
                descendNeighbor.children.unshift(moving);
            } else {
                descendNeighbor.children.push(moving);
            }
            drawAfterMove(info);
        } else {
            depthChange = 0;
        }
    }

    var swap = false;
    var diffX = info.absDiff[0];
    while (true) {
        var neighborI = moving.treeI + info.direction[0];
        var neighborSymbol = siblings[neighborI];
        if (neighborSymbol && diffX >= neighborSymbol.w / 2 && diffX > minMoveX) {
            swap = true;
            siblings[moving.treeI] = neighborSymbol;
            siblings[neighborSymbol.treeI] = moving;
            diffX -= neighborSymbol.w;
        } else {
            break;
        }
    }
    return depthChange !== 0 || swap;
};

var dragDepth = function (info) {
    var previousDepth = moving.depth;
    var depthChange = Math.round(info.diff[1] / levelHeight);
    var newDepth = previousDepth + depthChange;
    if (newDepth <= 0) {
        newDepth = 1;
    }
    return [newDepth, previousDepth];
};

var stringSetup = function () {

    var svg = d3.select('svg#string')
        .attr('width', width)
        .attr('height', height) ;

    offCameraToken = svg.append('g')
        .classed('token', true)
        .attr('transform', 'translate(-10000,-10000)')
        .append('text') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', function () {
            mouse = d3.mouse(camera.node());
            dragMoving();
        }) ;

    d3.select(document)
        .on('mouseup', function () { inputEvent('left mouse', 'up') })
        .on('keydown', function () { inputEvent(keyForEvent(), 'down') })
        .on('keyup', function () { inputEvent(keyForEvent(), 'up') }) ;


    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;

    computeStructure('token');
    draw(false);
};

var draw = function (sel) {
    if (sel === true || sel == null) {
        computeStructure(movingMode());
        sel = null;
    }
    sel = sel || fullSelection();
    computePositions(sel);
    render(sel);
};

var symbolId = function () {
    var id = symbolIdSequence;
    symbolIdSequence += 1;
    return id;
};

var createBar = function (bar) {
    return _.extend({
        id: symbolId(),
        symbol: true,
        bar: true,
        token: false,
        children: [],
        begin: null,
        end: null,
    }, bar);
};

var computeStructure = function (mode) {
    if (mode === 'token') {
        treeFromTokens();
    }
    if (mode === 'symbol') {
        tokensFromTree();
    }
    barsFromTree();
    allSymbols = allTokens.concat(allBars);
};

var treeFromTokens = function () {
    _.each(allTokens, function (t, i) { t.tokenI = i });

    allSymbolTree = createBar({
        depth: 0,
        begin: allTokens[0],
        end: allTokens[allTokens.length - 1],
    });

    _treeFromTokens(allSymbolTree, allTokens);
};

var _treeFromTokens = function (node, tokens) {
    var child = null;
    var attachChild = function (child) {
        child.parent = node;
        child.treeI = node.children.length;
        node.children.push(child);
        if (child.bar) {
            var childTokens = allTokens.slice(child.begin.tokenI, child.end.tokenI + 1);
            _treeFromTokens(child, childTokens);
        }
    };
    _.each(tokens, function (token) {
        var startChild;
        if (token.depth === node.depth + 1) {
            if (child) {
                attachChild(child);
                child = null;
            }
            attachChild(token);
        } else {
            if (!child) {
                child = createBar({
                    depth: node.depth + 1,
                    begin: token,
                });
            }
        }
        if (child) {
            child.end = token;
        }
    });
    if (child) {
        attachChild(child);
    }
};

var tokensFromTree = function () {
    allTokens = [];
    _tokensFromTree(allSymbolTree, 0, 1);
};

var _tokensFromTree = function (node, tokenI, depth) {
    var begin = node.children[0];
    var end = node.children[node.children.length - 1];
    node.children = _.filter(node.children, function (child, i) {
        if (child.token) {
            child.tokenI = tokenI;
            tokenI += 1;
            allTokens.push(child);
            return true;
        } else {
            var ret = _tokensFromTree(child, tokenI, depth + 1);
            tokenI = ret[0];
            if (i === 0) { begin = ret[1] }
            if (i === node.children.length) { end = ret[2] }
            return child.children.length > 0;
        }
    });
    _.each(node.children, function (child, i) {
        child.parent = node;
        child.depth = depth;
        child.treeI = i;
    });
    node.begin = begin;
    node.end = end;
    return [tokenI, begin, end];
};

var barsFromTree = function () {
    allBars = [allSymbolTree];
    _barsFromTree(allSymbolTree);
    allBars.reverse();
};

var _barsFromTree = function (node) {
    _.each(node.children, function (child) {
        if (child.bar) { allBars.push(child) }
    });
    _.each(node.children, function (child) {
        if (child.bar) { _barsFromTree(child) }
    });
};

var key = function (s) { return s.id };

var fullSelection = function () {
    var symbolEls = camera.selectAll('.symbol').data(allSymbols, key);
    return selection(allSymbols, symbolEls, true);
};

var movingSelection = function () {
    var symbolEls = camera.select('.symbol.moving');
    return selection([moving], symbolEls, false);
};

var selection = function (symbols, symbolEls, dataSelection) {
    var all,
        target, targetSiblings,
        tokens, bars,
        tokenEls, barEls,
        symbolEnterEls, tokenEnterEls, barEnterEls,
        symbolExitEls, tokenExitEls, barExitEls;

    all = symbols.length === allSymbols.length;

    target = moving || hovering;
    target = _.find(symbols, function (s) { return s === target });
    if (target) {
        targetSiblings = (target.parent && target.parent.children) || [target];
    } else {
        targetSiblings = [];
    }

    tokens = _.where(symbols, {token: true});
    bars = _.where(symbols, {bar: true});

    if (dataSelection) {
        symbolEnterEls = symbolEls.enter().append('g');
        symbolExitEls = symbolEls.exit();
        //symbolEls.order();
    } else {
        symbolEnterEls = symbolExitEls = d3.selectAll([]);
    }

    tokenEls = symbolEls.filter(_.property('token'));
    barEls = symbolEls.filter(_.property('bar'));

    tokenEnterEls = symbolEnterEls.filter(_.property('token'));
    barEnterEls = symbolEnterEls.filter(_.property('bar'));

    tokenExitEls = symbolExitEls.filter(_.property('token'));
    barExitEls = symbolExitEls.filter(_.property('bar'));

    return {
        all: all,
        target: target,
        targetSiblings: targetSiblings,
        symbols: symbols,
        tokens: tokens,
        bars: bars,
        symbolEls: symbolEls,
        tokenEls: tokenEls,
        barEls: barEls,
        symbolEnterEls: symbolEnterEls,
        tokenEnterEls: tokenEnterEls,
        barEnterEls: barEnterEls,
        symbolExitEls: symbolExitEls,
        tokenExitEls: tokenExitEls,
        barExitEls: barExitEls,
    };
};

var computePositions = function (sel) {
    if (sel.all) {
        var x = 0;
        _.each(sel.tokens, function (t) {
            var w;
            if (t.barrier) {
                w = 8;
            } else if (t.empty) {
                w = 30;
            } else {
                w = textWidth(t) + 15;
            }
            w += gapWidth;
            var pos = {x: x, w: w};
            x += w;
            _.extend(t, pos);
        });
    }

    _.each(sel.tokens, function (t) {
        var y = yFromDepth(t.depth);
        var pos = {y: y, offsetX: 0, offsetY: 0, h: 100 * levelHeight};
        _.extend(t, pos);
    });

    _.each(sel.bars, function (b) {
        var x = b.begin.x;
        var w = b.end.x + b.end.w - x;
        var y = yFromDepth(b.depth);
        var pos = {x: x, y: y, offsetX: 0, offsetY: 0, w: w, h: levelHeight};
        _.extend(b, pos);
    });

    if (moving) {
        var info = movingInfo();
        moving.offsetX = info.direction[0] * Math.min(info.absDiff[0] / 3, 2);
        moving.offsetY = info.direction[1] * Math.min(info.absDiff[1] / 3, 2);
    }
};

var yFromDepth = function (depth) {
    return depth * levelHeight + 10;
};


var render = function (sel) {

    ///// tokens draw

    sel.tokenEnterEls.append('rect')
        .classed('tower', true) ;

    sel.tokenEnterEls.append('text')
        .attr('y', 30) ;

    sel.tokenExitEls.remove();

    sel.tokenEls.select('rect.tower')
        .attr('x', gapWidth / 2)
        .attr('y', function (t) { return t.barrier ? 0 : gapHeight / 2 })
        .attr('width', function (t) { return t.w - gapWidth })
        .attr('height', 100 * levelHeight) ;

    sel.tokenEls.select('text')
        .attr('x', function (t) { return t.w / 2 })
        .text(function (t) { return t.empty ? "∅" : t.text }) ;


    ////// bars draw

    sel.barEnterEls.append('rect')
        .classed('background-bar', true)
        .attr('x', gapWidth / 2)
        .attr('y', gapHeight / 2)

    sel.barExitEls.remove();

    sel.barEls.select('rect.background-bar')
        .attr('width', function (b) { return b.w - gapWidth })
        .attr('height', function (b) {
            if (b === sel.target) {
                return 100 * levelHeight;
            } else {
                return levelHeight - gapHeight;
            }
        }) ;

    ////// symbols draw

    sel.symbolEls.attr('class', function (s) {
            var classes = _.filter([
                'symbol', 'token', 'bar',
                'barrier', 'empty',
            ], function (c) { return s[c] });
            if (s === sel.target) {
                classes.push('target');
            }
            if (_.contains(sel.targetSiblings, s)) {
                classes.push('target-sibling');
            }
            if (s === moving) {
                classes.push('moving');
            }
            return classes.join(' ');
        })
        .attr('transform', function (s) {
            return 'translate(' + (s.x + s.offsetX) + ',' + (s.y + s.offsetY) + ')';
        }) ;

    sel.symbolEnterEls.append('rect')
        .classed('top-bar', true)
        .attr('x', gapWidth / 2 + 4)
        .attr('y', gapHeight / 2)
        .attr('height', 5) ;

    sel.symbolEls.select('rect.top-bar')
        .attr('width', function (b) { return b.w - gapWidth - 8 }) ;

    sel.symbolEnterEls.append('rect')
        .classed('mouse', true)
        .on('mouseenter', function (s) {
            hovering = s;
            draw(false);
        })
        .on('mouseleave', function (s) {
            var last = hovering;
            if (s === last) { hovering = null }
            if (last) { draw(false) }
        })
        .attr('x', 0)
        .attr('y', 0) ;

    sel.symbolEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;

    sel.tokenEnterEls.select('rect.mouse')
        .on('mousedown', function (t) {
            mouse = d3.mouse(camera.node());
            hovering = t;
            inputEvent('left mouse', 'down');
            startMoving(t);
        }) ;
};


var textWidth = function (token, recompute) {
    if (!recompute && token._textWidth) {
        return token._textWidth;
    }
    offCameraToken.text(token.text);
    var box = offCameraToken.node().getBBox();
    token._textWidth = Math.ceil(box.width);
    return token._textWidth;
};

//////

var setup = function (data) {
    init();
    allSymbols = allTokens = data.tokens;
    symbolIdSequence = data.symbolIdSequence;
    stringSetup();

    console.log('untext loaded');
};

var setupExample = function (example) {
    setup({
        tokens: _.map(example.tokens, function (config, i) {
            return {
                id: i,
                symbol: true,
                bar: false,
                token: true,
                text: _.isString(config[0]) ? config[0] : '',
                barrier: config[0] === BARRIER,
                empty: config[0] === EMPTY,
                depth: config[1],
            };
        }),
        symbolIdSequence: example.tokens.length,
    });
};

setupExample({
    tokens: [['function', 1], ['addSym', 1], ['list', 2], ['symbol', 2], [BARRIER, 1], ['list', 2], ['.', 2], ['append', 2], ['symbol', 3], ['.', 3], ['createEl', 3], [EMPTY, 3]],
});

//return untext;

//})();
