var width = '100%';
var height = 300;
var depthHeight = 20;
var dividerWidth = 8;
var cameraStartX = 90;
var svgExtraHeight = 115;

var camera, cameraX, cameraStartX, _offCameraTower;

var fullSelection = function (dataSelection) {
    var viewEls = camera.selectAll('.view');
    if (dataSelection) {
        var views = viewsFromTree();
        viewEls = viewEls.data(views, _.property('id'));
    }
    return selection(viewEls, dataSelection);
};

var movingSelection = function () {
    var viewEls = camera.selectAll('.view.movingTree');
    return selection(viewEls, false);
};

var nullSelection = function () {
    var viewEls = d3.select();
    return selection(viewEls, false);
};

var selection = function (viewEls, dataSelection) {
    var targetSiblings, symbolsForTargets,
        autocomplete,
        towerEls, nonDividerEnterEls,
        viewEnterEls, towerEnterEls,
        viewExitEls;

    var target = state.target;
    if (target) {
        if (target.parent === allViewTree) {
            targetSiblings = [target];
        } else {
            targetSiblings = target.parent.children;
        }
        symbolsForTargets = _.compact(_.pluck(state.targets, 'symbol'));
    } else {
        symbolsForTargets = [];
        targetSiblings = [];
    }

    if (state.inserting && state.inserting.symbol === insertingReferenceSymbol) {
        if (state.inserting.text.length > 0) {
            autocomplete = symbolsForText(state.inserting.text);
            autocomplete = _.pluck(autocomplete, 'text');
            if (!autocomplete.length) {
                autocomplete = [null];
            }
        } else {
            autocomplete = [];
        }
    } else {
        autocomplete = [];
    }

    if (dataSelection) {
        viewEnterEls = viewEls.enter().append('g');
        viewExitEls = viewEls.exit();
        viewEls.order();
    } else {
        viewEnterEls = viewExitEls = d3.selectAll([]);
    }

    towerEls = viewEls.filter(_.property('tower'));
    towerEnterEls = viewEnterEls.filter(_.property('tower'));
    nonDividerEnterEls = viewEnterEls.filter(function (s) {
        return !s.divider;
    });

    var sel = {
        autocomplete: autocomplete,
        dataSelection: dataSelection,
        targetSiblings: targetSiblings,
        symbolsForTargets: symbolsForTargets,
        viewEls: viewEls,
        towerEls: towerEls,
        nonDividerEnterEls: nonDividerEnterEls,
        viewEnterEls: viewEnterEls,
        towerEnterEls: towerEnterEls,
        viewExitEls: viewExitEls,
    };
    return sel;
};

var computePositions = function (viewTree) {
    if (!allViewTree.children.length) {
        return;
    }
    _computePositions(viewTree);
    if (viewTree === allViewTree) {
        computeOtherPositions();
    }
    updateState({
        doPositions: false,
        doHovering: viewTree === allViewTree,
        doDraw: true,
    });
};

var computeOtherPositions = function () {
    otherPositions.svgHeight = allViewTree.h + svgExtraHeight;
    var lastTower = rightmostTower(allViewTree)[0];
    otherPositions.bodyHeight = window.innerHeight + lastTower.x + lastTower.w;
};

var _computePositions = function (node) {
    var nullPos = {x: 0, y: 0, w: 0, h: 0, offsetX: 0, offsetY: 0, braceW: 0, viewEndY: 0, towerY: 0, movingTree: false, dividerLeft: false};
    var leftTower = previousTower(node);
    var leftPos = leftTower ? leftTower[0].position : nullPos;
    var abovePos = node.parent ? node.parent.position : nullPos;

    var pos = {};

    pos.y = abovePos.y + depthHeight;
    pos.h = (node.height + 1) * depthHeight;

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
            pos.viewEndY = depthHeight;
        } else {
            pos.viewEndY = pos.towerY;
            pos.w = Math.max(node.textWidth + 15, 25);
        }
        pos.braceW = pos.w;
    } else {
        pos.viewEndY = depthHeight;
        node.position = pos;
        _.each(node.children, function (child) {
            _computePositions(child);
        });
        pos.x = leftmostTower(node)[0].position.x;
        var end = rightmostTower(node)[0];
        pos.braceW = end.position.x + end.position.w - pos.x;
        pos.w = pos.braceW;
        var left = node.parent && node.parent.children[treeI(node) - 1];
        var right = node.parent && node.parent.children[treeI(node) + 1];
        if (left && left.divider) {
            pos.dividerLeft = true;
            pos.x -= dividerWidth / 2;
            pos.w += dividerWidth / 2;
        } else {
            pos.dividerLeft = false;
        }
        if (right && right.divider) {
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
        .attr('height', otherPositions.svgHeight) ;

    d3.select(document.body)
        .style('height', otherPositions.bodyHeight + 'px') ;

    camera
        .classed('tower-mode', state.targetMode === 'tower')
        .classed('tree-mode', state.targetMode === 'tree')
        .attr('transform', function () {
            return 'translate(' + cameraX + ',0)';
        }) ;

    sel.viewExitEls.remove();

    ////// views draw

    sel.nonDividerEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 0) ;

    sel.viewEls.select('rect.background')
        .attr('width', _.property('w'))
        .attr('height', function (b) { return b.h + 20 }) ;

    sel.viewEls.attr('class', function (s) {
            var classes = _.filter([
                'symbol', 'tower', 'branch', 'reference',
                'divider', 'movingTree',
            ], function (c) { return s[c] });
            classes.push('view');
            if (_.contains(state.targets, s)) {
                classes.push('targets');
            }
            if (s === state.target) {
                classes.push('target');
            }
            if (_.contains(sel.targetSiblings, s)) {
                classes.push('target-sibling');
            }
            if (_.contains(sel.symbolsForTargets, s.symbol)) {
                classes.push('symbol-for-target');
            }
            return classes.join(' ');
        })
        .attr('transform', function (s) {
            return 'translate(' + (s.x + s.offsetX) + ',' + (s.y + s.offsetY) + ')';
        }) ;

    sel.nonDividerEnterEls.append('g')
        .call(topBraceEnter) ;

    sel.viewEls.select('g.top-brace')
        .call(topBrace) ;

    ///// towers (towers) draw

    sel.towerEnterEls.append('rect')
        .classed('tower', true) ;

    sel.towerEnterEls.append('text')
        .attr('y', depthHeight + 7) ;

    sel.towerEls.select('rect.tower')
        .attr('x', 2)
        .attr('y', _.property('towerY'))
        .attr('width', function (t) { return t.w - 4 })
        .attr('height', otherPositions.svgHeight) ;

    sel.towerEls.select('text')
        .attr('x', function (t) { return t.w / 2 })
        .text(_.property('text')) ;


    updateState({doDraw: false});
    if (sel.dataSelection) {
        updateState({doDataDraw: false});
    }


    // Autocomplete

    var autocomplete = camera.selectAll('g.autocomplete')
        .data(sel.autocomplete) ;

    var autoEnter = autocomplete.enter().append('g');

    autocomplete.exit().remove();

    autoEnter.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 20)
        .attr('width', 200) ;

    autoEnter.append('text')
        .attr('x', 4)
        .attr('y', 15) ;

    autocomplete
        .attr('class', function (a) {
            var classes = ['autocomplete'];
            if (!a) {
                classes.push('no-match');
            }
            return classes.join(' ');
        })
        .attr('transform', function (a, i) {
            var x = state.inserting.x + 10;
            var y = state.inserting.y + 40 + 20 * i;
            return 'translate(' + x + ',' + y + ')';
        }) ;

    autocomplete.select('text')
        .text(function (a) { return a || 'X - enter to create' }) ;
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
    var vertEndsY = 27;
    return  'M'+startX+','+vertEndsY+' '+
            'V'+endsY+' '+
            'C'+control1X+','+controlY+' '+control2X+','+midY+' '+horiz1X+','+midY+' '+
            'H'+horiz2X+' '+
            'C'+control3X+','+midY+' '+control4X+','+controlY+' '+endX+','+endsY+' '+
            'V'+vertEndsY;
};


var textWidth = function (text) {
    _offCameraTower.text(text || '%');
    var box = _offCameraTower.node().getBBox();
    return Math.ceil(box.width);
};
