var width = '100%';
var height = 300;
var levelHeight = 20;
var separatorWidth = 8;
var cameraStartX = 90;
var svgExtraHeight = 115;

var camera, cameraX, cameraStartX, _offCameraToken;

var drawSetup = function () {

    var svg = d3.select('svg#string')
        .attr('width', '100%') ;

    _offCameraToken = svg.append('g')
        .classed('token', true)
        .attr('transform', 'translate(-10000,-10000)')
        .append('text') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', mouseMove)
        .on('mouseleave', mouseLeave)
        .on('mouseenter', mouseEnter)
        .on('mousedown', mouseDown) ;

    cameraX = cameraStartX;

    d3.select(document)
        .on('mouseup', mouseUp)
        .on('scroll', mouseScroll)
        .on('keydown', function () { inputEvent(keyForEvent(), 'down') })
        .on('keyup', function () { inputEvent(keyForEvent(), 'up') })
        .on('keypress', function () { keypressEvent(d3.event.keyCode) }) ;

    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;

    computeStructure('tower');
    draw();
};

var draw = function (sel) {
    sel = sel || fullSelection();
    computePositions(sel);
    render(sel);
};

var fullSelection = function (dataSelection) {
    if (dataSelection == null) { dataSelection = true }
    var symbolEls = camera.selectAll('.symbol');
    if (dataSelection) {
        var symbols = symbolsFromTree(allSymbolTree);
        symbolEls = symbolEls.data(symbols, _.property('id'));
    }
    return selection(allSymbolTree, symbolEls, dataSelection);
};

var movingSelection = function () {
    var symbolEls = camera.selectAll('.symbol.movingTree');
    return selection(targeting.moving, symbolEls, false);
};

var selection = function (symbolTree, symbolEls, dataSelection) {
    var targetSiblings,
        tokenEls, nonSeparatorEnterEls,
        symbolEnterEls, tokenEnterEls,
        symbolExitEls;

    var target = targeting.target;
    if (target) {
        targetSiblings = (target.parent && target.parent.children) || [target];
    } else {
        targetSiblings = [];
    }

    if (dataSelection) {
        symbolEnterEls = symbolEls.enter().append('g');
        symbolExitEls = symbolEls.exit();
        symbolEls.order();
    } else {
        symbolEnterEls = symbolExitEls = d3.selectAll([]);
    }

    tokenEls = symbolEls.filter(_.property('token'));
    tokenEnterEls = symbolEnterEls.filter(_.property('token'));
    nonSeparatorEnterEls = symbolEnterEls.filter(function (s) {
        return !s.separator;
    });

    var sel = {
        targetSiblings: targetSiblings,
        symbolTree: symbolTree,
        symbolEls: symbolEls,
        tokenEls: tokenEls,
        nonSeparatorEnterEls: nonSeparatorEnterEls,
        symbolEnterEls: symbolEnterEls,
        tokenEnterEls: tokenEnterEls,
        symbolExitEls: symbolExitEls,
    };
    _.extend(sel, targeting);
    return sel;
};

var computePositions = function (sel) {
    _computePositions(sel.symbolTree);
    sel.svgHeight = allSymbolTree.h + svgExtraHeight;
    var lastToken = allTokens[allTokens.length - 1];
    sel.bodyHeight = window.innerHeight + lastToken.x + lastToken.w;
};

var _computePositions = function (node) {
    var nullPos = {x: 0, y: 0, w: 0, h: 0, offsetX: 0, offsetY: 0, braceW: 0, symbolEndY: 0, towerY: 0, movingTree: false};
    var leftI = (node.token ? node.tokenI : node.begin.tokenI) - 1;
    var leftPos = leftI >= 0 ? allTokens[leftI].position : nullPos;
    var abovePos = node.parent ? node.parent.position : nullPos;

    var pos = {};

    pos.y = abovePos.y + levelHeight;
    pos.h = (node.depth + 1) * levelHeight;

    if (node === targeting.moving) {
        var info = movingInfo();
        pos.offsetX = info.direction[0] * Math.min(info.absDiff[0] / 3, 2);
        pos.offsetY = info.direction[1] * Math.min(info.absDiff[1] / 3, 2);
        pos.movingTree = true;
    } else {
        pos.offsetX = abovePos.offsetX;
        pos.offsetY = abovePos.offsetY;
        pos.movingTree = abovePos.movingTree;
    }

    if (node.token) {
        pos.x = leftPos.x + leftPos.w;
        pos.tokenY = 35;
        if (node.separator) {
            pos.w = separatorWidth;
            pos.symbolEndY = levelHeight;
        } else {
            pos.symbolEndY = pos.tokenY;
            if (node.empty) {
                pos.w = 30;
            } else {
                pos.w = Math.max(textWidth(node) + 15, 25);
            }
        }
        pos.braceW = pos.w;
    } else {
        pos.symbolEndY = levelHeight;
        node.position = pos;
        _.each(node._children, function (child) {
            _computePositions(child);
        });
        pos.x = node.begin.position.x;
        pos.braceW = node.end.position.x + node.end.position.w - pos.x;
        pos.w = pos.braceW;
        if (node.separatorLeft) {
            pos.x -= separatorWidth / 2;
            pos.w += separatorWidth / 2;
        }
        if (node.separatorRight) {
            pos.w += separatorWidth / 2;
        }
    }
    node.position = pos;
    _.extend(node, pos);
};

var render = function (sel) {

    var svg = d3.select('svg#string')
        .attr('height', sel.svgHeight) ;

    d3.select(document.body)
        .style('height', sel.bodyHeight + 'px') ;

    camera
        .classed('tower-mode', sel.mode === 'tower')
        .classed('symbol-mode', sel.mode === 'symbol')
        .attr('transform', function () {
            return 'translate(' + cameraX + ',0)';
        }) ;

    sel.symbolExitEls.remove();

    ///// towers (tokens) draw

    sel.tokenEnterEls.append('rect')
        .classed('tower', true) ;

    sel.tokenEnterEls.append('text')
        .attr('y', levelHeight + 7) ;

    sel.tokenEls.select('rect.tower')
        .attr('x', 2)
        .attr('y', _.property('tokenY'))
        .attr('width', function (t) { return t.w - 4 })
        .attr('height', sel.svgHeight) ;

    sel.tokenEls.select('text')
        .attr('x', function (t) { return t.w / 2 })
        .text(function (t) { return t.empty ? "∅" : t.text }) ;

    ////// symbols draw

    sel.nonSeparatorEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 0) ;

    sel.symbolEls.select('rect.background')
        .attr('width', _.property('w'))
        .attr('height', function (b) { return b.h + 20 }) ;

    sel.symbolEls.attr('class', function (s) {
            var classes = _.filter([
                'symbol', 'token', 'bar',
                'separator', 'empty', 'movingTree',
            ], function (c) { return s[c] });
            if (s === sel.target) {
                classes.push('target');
            }
            if (_.contains(sel.targetSiblings, s)) {
                classes.push('target-sibling');
            }
            if (s === sel.moving) {
                classes.push('moving');
            }
            return classes.join(' ');
        })
        .attr('transform', function (s) {
            return 'translate(' + (s.x + s.offsetX) + ',' + (s.y + s.offsetY) + ')';
        }) ;

    sel.nonSeparatorEnterEls.append('g')
        .call(topBraceEnter) ;

    sel.symbolEls.select('g.top-brace')
        .call(topBrace) ;
};

var topBraceEnter = function (g) {
    g
        .classed('top-brace', true) ;

    g.append('rect')
        .classed('mid-point', true)
        .attr('y', 0)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', 6)
        .attr('height', 6) ;

    g.append('path');
};

var topBrace = function (g) {
    g
        .attr('transform', function (s) {
            if (s.separatorLeft) {
                return 'translate(' + (separatorWidth / 2) + ',0)';
            }
            return '';
        }) ;

    g.select('rect.mid-point')
        .attr('x', function (s) { return s.braceW / 2 - 3 }) ;

    g.select('path')
        .attr('d', topBracePath) ;
};

var topBracePath = function (s) {
    var midX = s.braceW / 2;
    var midY = 3;
    var startX = 2;
    var control1X = 3;
    var control2X = Math.min(15, midX);
    var horiz1X = Math.min(36, midX);
    var horiz2X = s.braceW - horiz1X;
    var control3X = s.braceW - control2X;
    var control4X = s.braceW - control1X;
    var controlY = 2;
    var endX = s.braceW - startX;
    var endsY = 19;
    var vertEndsY = 21;
    return  'M'+startX+','+vertEndsY+' '+
            'V'+endsY+' '+
            'C'+control1X+','+controlY+' '+control2X+','+midY+' '+horiz1X+','+midY+' '+
            'H'+horiz2X+' '+
            'C'+control3X+','+midY+' '+control4X+','+controlY+' '+endX+','+endsY+' '+
            'V'+vertEndsY;
};


var textWidth = function (token, recompute) {
    if (!recompute && token._textWidth) {
        return token._textWidth;
    }
    _offCameraToken.text(token.text || '%');
    var box = _offCameraToken.node().getBBox();
    token._textWidth = Math.ceil(box.width);
    return token._textWidth;
};
