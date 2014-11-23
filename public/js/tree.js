var symbolId = function () {
    var id = symbolIdSequence;
    symbolIdSequence += 1;
    return id;
};

var viewId = function () {
    var id = viewIdSequence;
    viewIdSequence += 1;
    return id;
};

var createView = function (symbol, view) {
    view = _.extend({
        id: viewId(),
        tower: !symbol || symbol.leaf,
        reference: false,
        divider: !symbol,
        dividerLeft: false,
        dividerRight: false,
        symbol: symbol,
        children: [],
        _children: [],
        text: '',
        depth: 0,
        height: 0,
        position: null,
        begin: null,
        end: null,
        parent: null,
        treeI: 0,
        towerI: 0,
    }, view || {});
    view.branch = !view.tower;
    return view;
};

var createSymbol = function (symbol) {
    symbol = symbol || {};
    var leaf = _.has(symbol, 'text');
    return _.extend({
        id: symbolId(),
        alive: true,
        leaf: leaf,
        branch: !leaf,
        children: [],
        parents: [],
        text: '',
        view: null,
    }, symbol);
};

var updateSymbol = function (view) {
    var symbol = view.symbol;
    var newChildren = _.pluck(view.children, 'symbol');
    var oldChildren = symbol.children;
    var removeChildren = _.difference(oldChildren, newChildren);
    var addChildren = _.difference(newChildren, oldChildren);
    _.each(removeChildren, function (child) {
        child.parents = _.without(child.parents, symbol);
    });
    _.each(addChildren, function (child) {
        child.parents.push(symbol);
    });
    symbol.children = newChildren;
    if (symbol.branch) {
        symbol.text = view.text;
    }
    symbol.view = view;
};

var maybeKillView = function (view) {
    if (!view.children.length) {
        killView(view);
    }
};
var killView = function (view) {
    _killView(view);
    killSymbol(view.symbol);
};
var _killView = function (view) {
    var parent = view.parent;
    parent.children = _.without(parent.children, view);
    if (!parent.children.length) {
        _killView(parent);
    }
};

var killSymbol = function (symbol) {
    _killSymbol(symbol, []);
};
var _killSymbol = function (symbol, visited) {
    symbol.alive = false;
    visited.push(symbol);
    _.each(symbol.parents, function (parent) {
        parent.children = _.without(parent.children, symbol);
        if (!parent.children.length && !_.contains(visited, parent)) {
            _killSymbol(parent, visited);
        }
    });
};

// TODO
var computeStructure = function (mode) {
    updateViews();
};

var updateViews = function (viewTree) {
    allViewTree = viewTree || allViewTree;
    _updateViews(allViewTree);
    towersFromTree();
    linkTowers(allTowers);
    linkTree(allViewTree, 0);
    updateState({
        doStructure: false,
        doPositions: true,
        doDataDraw: true,
    });
};

// TODO: what to about the oddball dividers?
var _updateViews = function (node) {
    var symbol = node.symbol;
    var oldChildren = node.children;
    if (!node.reference) {
        node.children = _.map(symbol.children, function (symbol) {
            var child;
            var i;
            for (i = 0; i < oldChildren.length; i++) {
                child = oldChildren[i];
                if (child.symbol === symbol) {
                    break;
                }
            }
            if (i === oldChildren.length) {
                child = symbol.view;
            } else {
                oldChildren.splice(i, 1);
            }
            _updateViews(child);
            return child;
        });
        node.text = symbol.text;
    }
};

var linkTree = function (node, depth) {
    var begin = node._children[0];
    var end = node._children[node._children.length - 1];
    var height = 1;
    node.children = _.filter(node._children, function (child, i) {
        child.parent = node;
        child.depth = depth + 1;
        if (child.branch) {
            var ret = linkTree(child, depth + 1);
            height = Math.max(height, ret[2] + 1);
            if (i === 0) { begin = ret[0]; }
            if (i === node._children.length - 1) { end = ret[1]; }
        }
        return !child.divider;
    });
    markDividers(node.children);

    _.each(node.children, function (child, i) {
        child.treeI = i;
    });
    node.begin = begin;
    node.end = end;
    node.height = height;
    return [begin, end, height];
};

var markDividers = function (children) {
    var lastChild = null;
    _.each(children, function (child, i) {
        child.dividerLeft = child.dividerRight = false;
        if (lastChild && lastChild.branch && child.branch) {
            lastChild.dividerRight = true;
            child.dividerLeft = true;
        }
        lastChild = child;
    });
};


//var computeStructure = function (mode) {
//    if (!mode) {
//        return;
//    }
//    if (mode === 'tower') {
//        treeFromTowers();
//    } else {
//        towersFromTree();
//    }
//    linkTowers(allTowers);
//    linkTree(allViewTree, 0);
//    updateState({
//        doStructure: false,
//        doPositions: true,
//        doDataDraw: true,
//    });
//};

var treeFromTowers = function () {
    allViewTree = _treeFromTowers(allTowers, 0);
};

var linkTowers = function (towers) {
    _.each(towers, function (t, i) { t.towerI = i });
};

var _treeFromTowers = function (towers, depth) {
    var node = createBar({depth: depth});
    var childBeginI = null;
    var attachBar = function (endI) {
        if (childBeginI != null) {
            attach(recurse(childBeginI, endI));
        }
    };
    var recurse = function (beginI, endI) {
        return _treeFromTowers(towers.slice(beginI, endI), depth + 1);
    };
    var attach = function (child) {
        if (child) {
            node._children.push(child);
        }
    };

    _.each(towers, function (tower, i) {
        if (tower.depth === node.depth + 1) {
            attachBar(i);
            childBeginI = null;
            attach(tower);
        } else {
            if (childBeginI == null) {
                childBeginI = i;
            }
        }
    });
    attachBar(towers.length);

    return node;
};

var towersFromTree = function () {
    addDividersToChildren(allViewTree, 0);
    var views = viewsFromTree();
    allTowers = _.filter(views, _.property('tower'));
};

var addDividersToChildren = function (node) {
    markDividers(node.children);
    var _children = [];
    _.each(node.children, function (child, i) {
        if (child.dividerLeft) {
            var tower = createView(null, {divider: true});
            _children.push(tower);
        }
        _children.push(child);
        if (child.branch) {
            addDividersToChildren(child);
        }
    });
    node._children = _children;
};

var viewsFromTree = function () {
    var views = [];
    _viewsFromTree(allViewTree, views);
    return views;
};

var _viewsFromTree = function (node, views) {
    _.each(node._children, function (child) {
        views.push(child);
        _viewsFromTree(child, views);
    });
};

var ancestor = function (node, n) {
    if (n === 0) {
        return node;
    }
    return ancestor(node.parent, n - 1);
};

var findUnderMouse = function () {
    return findFromCoordinates(mouse[0], mouse[1]);
};

var findFromCoordinates = function (x, y) {
    return _findFromCoordinates(allViewTree, x, y);
};

var _findFromCoordinates = function (node, x, y) {
    var ifNotFound = null;
    for (var i = 0; i < node._children.length; i++) {
        var child = node._children[i];
        if (child.x <= x && x <= child.x + child.w && y >= child.y) {
            if (child.tower) {
                if (y >= child.y + child.viewEndY) {
                    return [child, 'tower'];
                } else {
                    if (child.divider) {
                        ifNotFound = [child, 'tower'];
                    } else {
                        return [child, 'tree'];
                    }
                }
            } else {
                if (y < child.y + child.viewEndY) {
                    return [child, 'tree'];
                }
                var found = _findFromCoordinates(child, x, y);
                if (found) {
                    return found;
                }
            }
        }
    }
    return ifNotFound;
};

var findFromSiblings = function (siblings, x) {
    return _.find(siblings, function (sibling) {
        return x < sibling.x + sibling.w;
    }) || siblings[siblings.length - 1];
};

// TODO
var cloneTree = function (node) {
    var cNode = _.clone(node);
    cNode.id = viewId();
    if (cNode.branch) {
        cNode.children = _.map(node.children, function (child) {
            return cloneTree(child);
        });
    }

    // TODO: make refs the same symbols but appearing in different places.
    if (cNode.reference) {
        cNode.reference = cloneTree(cNode.ref);
    }
    return cNode;
};
