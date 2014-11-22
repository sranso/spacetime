var width = '100%';
var height = 300;
var levelHeight = 20;
var dividerWidth = 8;
var cameraStartX = 90;
var svgExtraHeight = 115;

var camera, cameraX, cameraStartX, _offCameraTower;

var allSymbolsFromTree;
var fullSelection = function (dataSelection) {
    var symbolEls = camera.selectAll('.symbol');
    if (dataSelection) {
        var symbols = symbolsFromTree();
        allSymbolsFromTree = symbols;
        symbolEls = symbolEls.data(symbols, _.property('id'));
    }
    return selection(symbolEls, dataSelection);
};

var movingSelection = function () {
    var symbolEls = camera.selectAll('.symbol.movingTree');
    return selection(symbolEls, false);
};

var nullSelection = function () {
    var symbolEls = d3.select();
    return selection(symbolEls, false);
};

var selection = function (symbolEls, dataSelection) {
    var targetSiblings,
        towerEls, nonDividerEnterEls,
        symbolEnterEls, towerEnterEls,
        symbolExitEls;

    var target = state.target;
    if (target) {
        if (target.parent === allDisplayTree) {
            targetSiblings = [target];
        } else {
            targetSiblings = target.parent.children;
        }
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

    towerEls = symbolEls.filter(_.property('tower'));
    towerEnterEls = symbolEnterEls.filter(_.property('tower'));
    nonDividerEnterEls = symbolEnterEls.filter(function (s) {
        return !s.divider;
    });

    var sel = {
        dataSelection: dataSelection,
        targetSiblings: targetSiblings,
        symbolEls: symbolEls,
        towerEls: towerEls,
        nonDividerEnterEls: nonDividerEnterEls,
        symbolEnterEls: symbolEnterEls,
        towerEnterEls: towerEnterEls,
        symbolExitEls: symbolExitEls,
    };
    return sel;
};

var computePositions = function (symbolTree) {
    _computePositions(symbolTree);
    if (symbolTree === allDisplayTree) {
        computeNonTreePositions();
    }
    updateState({
        doPositions: false,
        doHovering: symbolTree === allDisplayTree,
        doDraw: true,
    });
};

var computeNonTreePositions = function () {
    topLevelPositions.svgHeight = allDisplayTree.h + svgExtraHeight;
    var lastTower = allTowers[allTowers.length - 1];
    topLevelPositions.bodyHeight = window.innerHeight + lastTower.x + lastTower.w;
};

var _computePositions = function (node) {
    var nullPos = {x: 0, y: 0, w: 0, h: 0, offsetX: 0, offsetY: 0, braceW: 0, symbolEndY: 0, towerY: 0, movingTree: false};
    var leftI = (node.tower ? node.towerI : node.begin.towerI) - 1;
    var leftPos = leftI >= 0 ? allTowers[leftI].position : nullPos;
    var abovePos = node.parent ? node.parent.position : nullPos;

    var pos = {};

    pos.y = abovePos.y + levelHeight;
    pos.h = (node.depth + 1) * levelHeight;

    if (state.targetKind === 'moving' && _.contains(state.targets, node)) {
        var info = movingInfo();
        pos.offsetX = info.direction[0] * Math.min(info.absDiff[0] / 3, 2);
        pos.offsetY = info.direction[1] * Math.min(info.absDiff[1] / 3, 2);
        pos.movingTree = true;
    } else {
        pos.offsetX = abovePos.offsetX;
        pos.offsetY = abovePos.offsetY;
        pos.movingTree = abovePos.movingTree;
    }

    if (node.tower) {
        pos.x = leftPos.x + leftPos.w;
        pos.towerY = 35;
        if (node.divider) {
            pos.w = dividerWidth;
            pos.symbolEndY = levelHeight;
        } else {
            pos.symbolEndY = pos.towerY;
            pos.w = Math.max(textWidth(node) + 15, 25);
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
        if (node.dividerLeft) {
            pos.x -= dividerWidth / 2;
            pos.w += dividerWidth / 2;
        }
        if (node.dividerRight) {
            pos.w += dividerWidth / 2;
        }
    }
    node.position = pos;
    _.extend(node, pos);
};


///////////////

var drawSetup = function () {

    var svg = d3.select('svg#string')
        .attr('width', '100%') ;

    _offCameraTower = svg.append('g')
        .classed('tower', true)
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
};

var draw = function (sel) {

    var svg = d3.select('svg#string')
        .attr('height', topLevelPositions.svgHeight) ;

    d3.select(document.body)
        .style('height', topLevelPositions.bodyHeight + 'px') ;

    camera
        .classed('tower-mode', state.targetMode === 'tower')
        .classed('symbol-mode', state.targetMode === 'symbol')
        .attr('transform', function () {
            return 'translate(' + cameraX + ',0)';
        }) ;

    sel.symbolExitEls.remove();

    ///// towers (towers) draw

    sel.towerEnterEls.append('rect')
        .classed('tower', true) ;

    sel.towerEnterEls.append('text')
        .attr('y', levelHeight + 7) ;

    sel.towerEls.select('rect.tower')
        .attr('x', 2)
        .attr('y', _.property('towerY'))
        .attr('width', function (t) { return t.w - 4 })
        .attr('height', topLevelPositions.svgHeight) ;

    sel.towerEls.select('text')
        .attr('x', function (t) { return t.w / 2 })
        .text(_.property('text')) ;

    ////// symbols draw

    sel.nonDividerEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 0) ;

    sel.symbolEls.select('rect.background')
        .attr('width', _.property('w'))
        .attr('height', function (b) { return b.h + 20 }) ;

    sel.symbolEls.attr('class', function (s) {
            var classes = _.filter([
                'symbol', 'tower', 'branch', 'reference',
                'divider', 'movingTree',
            ], function (c) { return s[c] });
            if (_.contains(state.targets, s)) {
                classes.push('targets');
            }
            if (s === state.target) {
                classes.push('target');
            }
            if (_.contains(sel.targetSiblings, s)) {
                classes.push('target-sibling');
            }
            return classes.join(' ');
        })
        .attr('transform', function (s) {
            return 'translate(' + (s.x + s.offsetX) + ',' + (s.y + s.offsetY) + ')';
        }) ;

    sel.nonDividerEnterEls.append('g')
        .call(topBraceEnter) ;

    sel.symbolEls.select('g.top-brace')
        .call(topBrace) ;


    updateState({doDraw: false});
    if (sel.dataSelection) {
        updateState({doDataDraw: false});
    }
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
            if (s.dividerLeft) {
                return 'translate(' + (dividerWidth / 2) + ',0)';
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


var textWidth = function (tower, recompute) {
    if (!recompute && tower._textWidth) {
        return tower._textWidth;
    }
    _offCameraTower.text(tower.text || '%');
    var box = _offCameraTower.node().getBBox();
    tower._textWidth = Math.ceil(box.width);
    return tower._textWidth;
};
