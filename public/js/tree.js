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
        height: 0,
        position: null,
        parent: null,
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

var update = function (view) {
    _.each(view.children, function (child) {
        child.parent = view;
    });
    updateSymbol(view);
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
    if (symbol.leaf) {
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

var computeStructure = function () {
    _updateViews(allViewTree);
    addDividersToChildren(allViewTree, 0);
    linkTreeHeight(allViewTree);
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

            child.parent = node;
            _updateViews(child);
            return child;
        });
        node.text = symbol.text;
    }
};

var linkTreeHeight = function (node) {
    var height = 1;
    _.each(node.children, function (child, i) {
        if (child.branch) {
            var childHeight = linkTreeHeight(child);
            height = Math.max(height, childHeight + 1);
        }
    });
    node.height = height;
    return height;
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

var previousTower = function (node, depth) {
    depth = depth || 0;
    while (true) {
        if (!node.parent) {
            return null;
        }
        var i = treeI(node);
        if (i === 0) {
            node = node.parent;
            depth -= 1;
        } else {
            return rightmostTower(node.parent.children[i - 1], depth);
        }
    }
};

var rightmostTower = function (node, depth) {
    depth = depth || 0;
    while (true) {
        if (node.tower) {
            return [node, depth];
        }
        node = node.children[node.children.length - 1];
        depth += 1;
    }
};

var nextTower = function (node, depth) {
    depth = depth || 0;
    while (true) {
        if (!node.parent) {
            return null;
        }
        var i = treeI(node);
        if (i === node.parent.children.length - 1) {
            node = node.parent;
            depth -= 1;
        } else {
            return leftmostTower(node.parent.children[i + 1], depth);
        }
    }
};

var leftmostTower = function (node, depth) {
    depth = depth || 0;
    while (true) {
        if (node.tower) {
            return [node, depth];
        }
        node = node.children[0];
        depth += 1;
    }
};

var treeI = function (node) {
    return node.parent.children.indexOf(node);
};

var findUnderMouse = function () {
    return findFromCoordinates(mouse[0], mouse[1]);
};

var findFromTowers = function (x) {
    var found = findFromCoordinates(x, 10000);
    if (found) {
        return found[0];
    }
    return null;
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
