window.untext = (function () {

var BARRIER = 1;
var EMPTY = 2;
var width = '100%';
var height = 300;
var levelHeight = 26;
var gapWidth = 8;

var untext, allSymbols, symbolIdSequence, offCameraToken, camera, moving;

var init = function () {
    untext = {};
    allSymbols = [];
    symbolIdSequence = 0;
    moving = null;
};

//////

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
            if (moving) {
                var mouse = d3.mouse(camera.node());
                var startMouse = moving.startMouse;
                var diff = [mouse[0] - startMouse[0], mouse[1] - startMouse[1]];
                var currentPos = {x: moving.x, y: moving.y};

                var depthChange = Math.round(diff[1] / levelHeight);
                moving.depth += depthChange;
                if (depthChange !== 0) {
                    draw(allSymbols);
                    moving.startMouse = [
                        startMouse[0] + moving.x - currentPos.x,
                        startMouse[1] + moving.y - currentPos.y,
                    ];
                }
            }
        }) ;

    d3.select(document)
        .on('mouseup', function () { moving = null })

    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;

    draw(allSymbols);
};

var draw = function (symbolsOrEls, removeSymbols) {
    var selection = getSelection(symbolsOrEls, removeSymbols);
    console.log("selection: ");
    console.log(selection);
    computePositions.call(selection);
    render.call(selection);
};

var symbolId = function () {
    var id = symbolIdSequence;
    symbolIdSequence += 1;
    return id;
};

var recomputeSymbols = function () {
    var depth = 0;
    var bars = [];
    var tokens = _.where(allSymbols, {token: true});
    var tokensBelowDepth = tokens;

    _.each(tokens, function (t, i) { t.i = i });

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

    allSymbols = tokens.concat(bars);
    return allSymbols;
};

var key = function (s) { return s.id };

var getSelection = function (symbolsOrEls, removeSymbols) {
    var symbols, tokens, bars,
        symbolEls, tokenEls, barEls,
        symbolEnterEls, tokenEnterEls, barEnterEls,
        symbolExitEls, tokenExitEls, barExitEls;

    if (symbolsOrEls instanceof d3.selection) {
        symbolEls = symbolsOrEls;
        symbols = symbolEls.data();
    } else if (symbolsOrEls === allSymbols) {
        symbols = recomputeSymbols();
        symbolEls = camera.selectAll('.symbol').data(symbols, key);
    } else {
        symbols = symbolsOrEls;
        var combinedSymbols = symbols.concat(removeSymbols || []);
        symbolEls = _.filter(_.pluck(combinedSymbols, '__el__'));
        symbolEls = d3.selectAll(symbolEls).data(symbols, key);
    }

    tokens = _.where(symbols, {token: true});
    bars = _.where(symbols, {bar: true});

    symbolEnterEls = symbolEls.enter().append('g')
        .classed('symbol', true)
        .each(function (s) { s.__el__ = this }) ;

    symbolExitEls = symbolEls.exit();

    tokenEls = symbolEls.filter(_.property('token'));
    barEls = symbolEls.filter(_.property('bar'));

    tokenEnterEls = symbolEnterEls.filter(_.property('token'));
    barEnterEls = symbolEnterEls.filter(_.property('bar'));

    tokenExitEls = symbolExitEls.filter(_.property('token'));
    barExitEls = symbolExitEls.filter(_.property('bar'));

    return {
        all: symbols.length === allSymbols.length,
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

var computePositions = function () {

    ///// tokens compute

    if (this.all) {
        var x = 0;
        _.each(this.tokens, function (t) {
            var w;
            if (t.barrier) {
                w = 5;
            } else if (t.empty) {
                w = 30;
            } else {
                w = textWidth(t) + 15;
            }
            w += gapWidth;
            var y = yFromDepth(t.depth);
            var pos = {x: x, y: y, w: w};
            x += w;
            _.extend(t, pos);
        });

        _.each(this.bars, function (b) {
            var x = b.start.x;
            var w = b.stop.x + b.stop.w - x;
            var pos = {x: x, y: yFromDepth(b.depth), w: w};
            _.extend(b, pos);
        });
    }
};

var yFromDepth = function (depth) {
    return depth * levelHeight + 10;
};

var hover = function (el, symbol, hovered) {
    symbol.hovered = hovered;
    return d3.select(el.parentNode).classed('hovered', hovered);
};

var render = function () {

    ///// tokens draw

    this.tokenEnterEls
        .classed('token', true) ;

    this.tokenEnterEls.append('rect')
        .classed('tower', true) ;

    this.tokenEnterEls.append('text')
        .attr('y', 30) ;

    this.tokenEnterEls.append('rect')
        .classed('mouse', true)
        .on('mouseenter', function (t) { hover(this, t, true) })
        .on('mouseleave', function (t) { hover(this, t, false) })
        .on('mousedown', function (t) {
            moving = t;
            moving.startOffset = d3.mouse(this.parentNode);
            moving.startMouse = d3.mouse(camera.node());
        })
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 100 * levelHeight) ;

    this.tokenExitEls.remove();

    this.tokenEls.attr('class', function (t) {
            return 'symbol token ' + (t.barrier ? 'barrier' : '') + (t.empty ? 'empty' : '');
        }) ;

    this.tokenEls.transition()
        .duration(80)
        .attr('transform', function (t) {
            return 'translate(' + t.x + ',' + t.y + ')';
        }) ;

    this.tokenEls.select('rect.tower')
        .attr('x', gapWidth / 2)
        .attr('y', function (t) { return t.barrier ? 0 : 6 })
        .attr('width', function (t) { return t.w - gapWidth })
        .attr('height', 100 * levelHeight) ;

    this.tokenEls.select('text')
        .attr('x', function (t) { return t.w / 2 })
        .text(_.property('text')) ;

    this.tokenEls.select('rect.mouse')
        .attr('width', _.property('w')) ;


    ////// bars draw

    this.barEnterEls
        .classed('bar', true) ;

    this.barEnterEls.append('rect')
        .classed('background-bar', true)
        .attr('x', gapWidth / 2)
        .attr('y', 6)
        .attr('height', levelHeight - 5) ;

    this.barEnterEls.append('rect')
        .classed('top-bar', true)
        .attr('x', gapWidth / 2)
        .attr('y', 6)
        .attr('height', 5) ;

    this.barEnterEls.append('rect')
        .classed('mouse', true)
        .on('mouseenter', function (b) {
            hover(this, b, true)
                .select('.background-bar').attr('height', 100 * levelHeight) ;
        })
        .on('mouseleave', function (b) {
            hover(this, b, false)
                .select('.background-bar').attr('height', levelHeight - 5) ;
        })
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', levelHeight) ;

    this.barExitEls.remove();

    this.barEls.attr('transform', function (b) {
            return 'translate(' + b.x + ',' + b.y + ')';
        }) ;

    this.barEls.select('rect.background-bar')
        .attr('width', function (b) { return b.w - gapWidth }) ;

    this.barEls.select('rect.top-bar')
        .attr('width', function (b) { return b.w - gapWidth }) ;

    this.barEls.select('rect.mouse')
        .attr('width', _.property('w'))
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
    allSymbols = data.tokens;
    symbolIdSequence = data.symbolIdSequence;
    stringSetup();

    console.log('untext loaded');
};

var setupExample = function (example) {
    setup({
        tokens: _.map(example.tokens, function (config, i) {
            return {
                id: i,
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

return untext;

})();
