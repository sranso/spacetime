window.untext = (function () {

var BARRIER = 1;
var EMPTY = 2;

var untext, tokens, offCameraToken;

var init = function () {
    untext = {};
    tokens = [];
};

//////

var stringSetup = function () {
    var width = 800;
    var height = 800;
    var levelHeight = 26;
    var gapWidth = 8;

    var svg = d3.select('svg#string')
        .attr('width', width)
        .attr('height', height) ;

    offCameraToken = svg.append('g')
        .classed('token', true)
        .attr('transform', 'translate(-1000,-1000)')
        .append('text') ;

    var camera = svg.append('g');


    ///// tokens compute

    var x = 0;
    _.each(tokens, function (t, i) {
        var w;
        if (t.barrier) {
            w = 5;
        } else if (t.empty) {
            w = 30;
        } else {
            w = t.textWidth() + 15;
        }
        w += gapWidth;
        var y = t.depth * levelHeight + 10;
        var pos = {x: x, y: y, w: w, i: i};
        x += w;
        _.extend(t, pos);
    });


    ////// bars compute

    var depth = 0;
    var bars = [];
    var tokensBelowDepth = tokens.slice();
    while (tokensBelowDepth.length) {
        var currentBar = {
            depth: depth,
            start: tokensBelowDepth[0],
            stop: {i: tokensBelowDepth[0].i - 1},
        };
        var nextTokensBelowDepth = [];
        var nextDepth = depth + 1;
        _.each(tokensBelowDepth, function (token) {
            if (token.i === currentBar.stop.i + 1) {
                currentBar.stop = token;
            } else {
                bars.push(currentBar);
                currentBar = {
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

    _.each(bars, function (b, i) {
        var x = b.start.x;
        var w = b.stop.x + b.stop.w - x;
        var pos = {x: x, y: b.start.y - levelHeight, w: w, i: i};
        _.extend(b, pos);
    });

    bars.reverse();


    ///// tokens draw

    var ts = camera.selectAll('g.token')
        .data(tokens) ;

    var t = ts.enter().append('g')
        .attr('class', function (t) {
            return 'symbol token ' + (t.barrier ? 'barrier' : '') + (t.empty ? 'empty' : '');
        })
        .attr('transform', function (t) {
            return 'translate(' + t.x + ',' + t.y + ')';
        }) ;

    t.append('rect')
        .classed('tower', true)
        .attr('x', gapWidth / 2)
        .attr('y', function (t) { return t.barrier ? 0 : 6 })
        .attr('width', function (t) { return t.w - gapWidth })
        .attr('height', function (t) {
            return 10 * levelHeight - t.y - (t.barrier ? 0 : 6);
        }) ;

    t.append('text')
        .attr('y', 30)
        .attr('x', function (t) { return t.w / 2 })
        .text(_.property('text')) ;

    t.append('rect')
        .classed('mouse', true)
        .on('mouseenter', function () { d3.select(this.parentNode).classed('hovered', true) })
        .on('mouseleave', function () { d3.select(this.parentNode).classed('hovered', false) })
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', _.property('w'))
        .attr('height', function (t) { return 10 * levelHeight - t.y }) ;

    ts.exit().remove();


    ////// bars draw

    var bs = camera.selectAll('g.bar')
        .data(bars) ;

    var b = bs.enter().append('g')
        .classed('symbol bar', true)
        .attr('transform', function (b) {
            return 'translate(' + b.x + ',' + b.y + ')';
        }) ;

    b.append('rect')
        .classed('background-bar', true)
        .attr('x', gapWidth / 2)
        .attr('y', 6)
        .attr('width', function (b) { return b.w - gapWidth })
        .attr('height', levelHeight - 5) ;

    b.append('rect')
        .classed('top-bar', true)
        .attr('x', gapWidth / 2)
        .attr('y', 6)
        .attr('width', function (b) { return b.w - gapWidth })
        .attr('height', 5) ;

    b.append('rect')
        .classed('mouse', true)
        .on('mouseenter', function () {
            d3.select(this.parentNode).classed('hovered', true)
                .select('.background-bar').attr('height', function (b) {
                    return 10 * levelHeight - b.y - 6;
                }) ;
        })
        .on('mouseleave', function () {
            d3.select(this.parentNode).classed('hovered', false)
                .select('.background-bar').attr('height', levelHeight - 5) ;
        })
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', _.property('w'))
        .attr('height', levelHeight) ;

    bs.exit().remove();
};

//////

var Token = function (token) {
    this.text = token.text || '';
    this.depth = token.depth;
    this.barrier = token.barrier || false;
    this.empty = token.empty || false;
};

Token.prototype.textWidth = function (recompute) {
    if (!recompute && this._textWidth) {
        return this._textWidth;
    }
    offCameraToken.text(this.text);
    var box = offCameraToken.node().getBBox();
    this._textWidth = Math.ceil(box.width);
    return this._textWidth;
};

//////

var setup = function (data) {
    init();
    tokens = data.tokens;
    stringSetup();

    console.log('untext loaded');
};

var setupExample = function (example) {
    var newToken = function (t) {
        if (t[0] === BARRIER) {
            return new Token({barrier: true, depth: t[1]});
        }
        if (t[0] === EMPTY) {
            return new Token({empty: true, depth: t[1]});
        }
        return new Token({text: t[0], depth: t[1]});
    };
    var data = {
        tokens: _.map(example.tokens, newToken),
    }, newSym;
    setup(data);
};

setupExample({
    tokens: [['function', 1], ['addSym', 1], ['list', 2], ['symbol', 2], [BARRIER, 1], ['list', 2], ['.', 2], ['append', 2], ['symbol', 3], ['.', 3], ['createEl', 3], [EMPTY, 3]],
});

return untext;

})();
