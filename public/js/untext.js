//window.untext = (function () {

var BARRIER = 1;
var EMPTY = 2;
var width = '100%';
var height = 300;
var levelHeight = 26;
var gapWidth = 8;
var gapHeight = 6;

var keyboardConfigurations = {
    qwerty: {
        move: 'v',
    },
    dvorak: {
        move: 'k',
    },
};

var untext, allSymbols, allTokens, symbolIdSequence, offCameraToken, camera,
    moving, hovering, mouse, keyboardLayout;

var init = function () {
    untext = {};
    allSymbols = [];
    allTokens = [];
    symbolIdSequence = 0;
    moving = null;
    hovering = null;
    mouse = [0, 0];
    keyboardLayout = 'dvorak';
};

//////

var keyFor = function (action) {
    return keyboardConfigurations[keyboardLayout][action];
};

var movingInfo = function () {
    var startMouse = moving.startMouse;
    var diff = [mouse[0] - startMouse[0], mouse[1] - startMouse[1]];
    return {
        diff: diff,
        direction: [diff[0] >= 0 ? 1 : -1, diff[1] >= 0 ? 1 : -1],
        absDiff: [Math.abs(diff[0]), Math.abs(diff[1])],
    };
};

var startMoving = function (s) {
    if (!moving) {
        moving = s;
        moving.startMouse = mouse;
        moving.startTime = Date.now();
        draw([s]);
    }
};

var stopMoving = function (s) {
    if (moving) {
        moving = null;
        draw(allSymbols);
    }
};

var dragMoving = function () {
    if (!moving) {
        return;
    }

    var info = movingInfo();

    var depthChange = Math.round(info.diff[1] / levelHeight);
    moving.depth += depthChange;

    var swap = false;
    var diffX = info.absDiff[0];
    while (true) {
        var neighborI = moving.i + info.direction[0];
        var neighborSymbol = allTokens[neighborI];
        if (neighborSymbol && diffX >= neighborSymbol.w / 2) {
            swap = true;
            allTokens[moving.i] = neighborSymbol;
            allTokens[neighborSymbol.i] = moving;
            neighborSymbol.i = moving.i;
            moving.i = neighborI;
            diffX -= neighborSymbol.w;
        } else {
            break;
        }
    }

    if (depthChange === 0 && !swap) {
        draw([moving]);
    } else {
        var currentPos = {x: moving.x, y: moving.y};
        var sel = sel || selection(allSymbols);
        compute(sel);
        moving.startMouse = [
            moving.startMouse[0] + moving.x - currentPos.x,
            moving.startMouse[1] + moving.y - currentPos.y,
        ];
        compute([moving]);
        render(sel);
    }
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
        .on('mouseup', stopMoving) ;

    Mousetrap.bind(keyFor('move'), function (e) {
        if (hovering) { startMoving(hovering) }
    }, 'keydown');
    Mousetrap.bind(keyFor('move'), stopMoving, 'keyup');
    Mousetrap.bind('e', function () { debugger; });

    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;

    draw(allSymbols);
};

var draw = function (symbolsOrEls, removeSymbols) {
    var sel = selection(symbolsOrEls, removeSymbols);
    compute(sel);
    render(sel);
};

var symbolId = function () {
    var id = symbolIdSequence;
    symbolIdSequence += 1;
    return id;
};

var recomputeSymbols = function () {
    var depth = 0;
    var bars = [];
    var tokensBelowDepth = allTokens;

    _.each(allTokens, function (t, i) { t.i = i });

    while (tokensBelowDepth.length) {
        var currentBar = null;
        var nextTokensBelowDepth = [];
        var nextDepth = depth + 1;
        _.each(tokensBelowDepth, function (token) {
            if (currentBar && token.i === currentBar.stop.i + 1) {
                currentBar.stop = token;
            } else {
                if (currentBar) {
                    bars.push(currentBar);
                }
                currentBar = {
                    id: symbolId(),
                    symbol: true,
                    bar: true,
                    depth: depth,
                    start: token,
                    stop: token,
                };
            }

            if (token.depth > nextDepth) {
                nextTokensBelowDepth.push(token);
            }
        });
        bars.push(currentBar);
        tokensBelowDepth = nextTokensBelowDepth;
        depth = nextDepth;
    }
    bars.reverse();

    allSymbols = allTokens.concat(bars);
    return allSymbols;
};

var key = function (s) { return s.id };

var selection = function (symbolsOrEls, removeSymbols) {
    var order,
        symbols, tokens, bars,
        symbolEls, tokenEls, barEls,
        symbolEnterEls, tokenEnterEls, barEnterEls,
        symbolExitEls, tokenExitEls, barExitEls;

    if (symbolsOrEls instanceof d3.selection) {
        symbolEls = symbolsOrEls;
        symbols = symbolEls.data();
        order = true;
    } else if (symbolsOrEls === allSymbols) {
        symbols = recomputeSymbols();
        symbolEls = camera.selectAll('.symbol').data(symbols, key);
        order = true;
    } else {
        symbols = _.filter(symbolsOrEls);
        order = false;

        removeSymbols = _.filter(removeSymbols || []);
        symbolExitEls = d3.selectAll(_.pluck(removeSymbols, '__el__'));
        _.each(removeSymbols, function (s) { s.__el__ = null })

        var enter = _.filter(symbols, function (s) { return !s.__el__ });
        _.each(enter, function (s) {
            s.__el__ = camera.append('g').datum(s).node();
        });
        symbolEnterEls = d3.selectAll(_.pluck(enter, '__el__'));
        symbolEls = d3.selectAll(_.pluck(symbols, '__el__'));
    }

    if (order) {
        symbolEnterEls = symbolEls.enter().append('g');
        symbolExitEls = symbolEls.exit();
        //symbolEls.order();
    }

    tokens = _.where(symbols, {token: true});
    bars = _.where(symbols, {bar: true});

    symbolEnterEls.each(function (s) { s.__el__ = this });

    tokenEls = symbolEls.filter(_.property('token'));
    barEls = symbolEls.filter(_.property('bar'));

    tokenEnterEls = symbolEnterEls.filter(_.property('token'));
    barEnterEls = symbolEnterEls.filter(_.property('bar'));

    tokenExitEls = symbolExitEls.filter(_.property('token'));
    barExitEls = symbolExitEls.filter(_.property('bar'));

    console.log('symbols: ' + symbols.length + '; symbol els: ' + symbolEls.size() + '; enter: ' + symbolEnterEls.size() + '; exit: ' + symbolExitEls.size() + '');

    return {
        all: symbols.length === allSymbols.length,
        target: moving || hovering,
        order: order,
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

var compute = function (sel) {

    ///// tokens compute

    if (sel.all) {
        var x = 0;
        _.each(sel.tokens, function (t) {
            var w;
            if (t.barrier) {
                w = 5;
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
        var x = b.start.x;
        var w = b.stop.x + b.stop.w - x;
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
            if (b === hovering) {
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
        .attr('x', gapWidth / 2)
        .attr('y', gapHeight / 2)
        .attr('height', 5) ;

    sel.symbolEls.select('rect.top-bar')
        .attr('width', function (b) { return b.w - gapWidth }) ;

    sel.symbolEnterEls.append('rect')
        .classed('mouse', true)
        .on('mouseenter', function (t) {
            hovering = t;
            draw([t]);
        })
        .on('mouseleave', function (t) {
            var last = hovering;
            if (t === last) { hovering = null }
            if (last) { draw([last]) }
        })
        .attr('x', 0)
        .attr('y', 0) ;

    sel.symbolEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;

    sel.tokenEnterEls.select('rect.mouse')
        .on('mousedown', function (t) {
            mouse = d3.mouse(camera.node());
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
