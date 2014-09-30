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

    var svg = d3.select('svg#string')
        .attr('width', width)
        .attr('height', height) ;

    offCameraToken = svg.append('g')
        .classed('token', true)
        .attr('transform', 'translate(-1000,-1000)')
        .append('text') ;

    var camera = svg.append('g');

    var ts = camera.selectAll('g.token')
        .data(tokens) ;

    var x = 0;
    _.each(tokens, function (t) {
        var w;
        if (t.barrier) {
            w = 30;
        } else if (t.empty) {
            w = 50;
        } else {
            w = t.textWidth() + 30;
        }
        var y = t.depth * 20 + 10;
        var pos = {x: x, y: y, w: w};
        x += w;
        _.extend(t, pos);
    });

    var t = ts.enter().append('g')
        .classed('token', true)
        .attr('transform', function (t) {
            return 'translate(' + t.x + ',' + t.y + ')';
        }) ;

    t.append('rect')
        .attr('x', 7)
        .attr('y', 10)
        .attr('width', function (t) { return t.w - 14 })
        .attr('height', function (t) {
            return 120 - t.y
        }) ;

    t.append('text')
        .attr('y', 30)
        .attr('x', function (t) { return t.w / 2 })
        .text(function (d) { return d.text }) ;

    ts.exit().remove();
};

//////

var Token = function (token) {
    this.text = token.text || "";
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
