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
    view = view || {};
    view = _.extend({
        id: viewId(),
        tower: !symbol || symbol.leaf || view.reference || false,
        reference: false,
        divider: !symbol,
        symbol: symbol,
        children: [],
        text: '',
        height: 0,
        position: null,
        parent: null,
    }, view);
    view.branch = !view.tower;
    return view;
};

var createSymbol = function (symbol) {
    symbol = symbol || {};
    var leaf = symbol.text != null;
    return _.extend({
        id: symbolId(),
        alive: true,
        leaf: leaf,
        branch: !leaf,
        children: [],
        parents: [],
        text: null,
        textWidth: leaf ? textWidth(symbol.text) : null,
        view: null,
    }, symbol);
};

var updateTree = function (view) {
    fixDividers(view);
    update(view);
};

var fixDividers = function (node) {
    var lastChild = null;
    var newChildren = [];
    _.each(node.children, function (child, i) {
        if (child.divider) {
            return;
        }
        if (lastChild && lastChild.branch && child.branch) {
            newChildren.push(createView(null));
        }
        newChildren.push(child);
        lastChild = child;
    });
    node.children = newChildren;
};

var update = function (view) {
    _.each(view.children, function (child) {
        child.parent = view;
    });
    updateSymbol(view);
};

var updateSymbol = function (view) {
    var symbol = view.symbol;
    var newChildren = _.compact(_.pluck(view.children, 'symbol'));
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
        if (symbol.text !== view.text) {
            symbol.text = view.text;
            symbol.textWidth = textWidth(view.text);
        }
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
    linkTreeHeight(allViewTree);
    updateState({
        doStructure: false,
        doPositions: true,
        doDataDraw: true,
    });
};

var _updateViews = function (node) {
    if (node.reference) {
        var left = leftmostLeaf(node.symbol);
        node.text = left.text;
        node.textWidth = left.textWidth;
    } else if (node.tower) {
        node.text = node.symbol.text;
        node.textWidth = node.symbol.textWidth;
    } else {
        var oldSymbols = _.compact(_.pluck(node.children, 'symbol'));
        var everyEqual = _.every(oldSymbols, function (s, i) {
            return s === node.symbol.children[i];
        });
        if (!everyEqual || node.symbol.children.length !== oldSymbols.length) {
            _updateViewChildren(node);
        }
        _.each(node.children, function (child) {
            if (child.symbol) {
                _updateViews(child);
            }
        });
    }
};

var _updateViewChildren = function (node) {
    var oldChildren = node.children.slice();
    var newChildren = [];
    var lastChild = null;
    _.each(node.symbol.children, function (symbol) {
        var child;
        var i;
        for (i = 0; i < oldChildren.length; i++) {
            child = oldChildren[i];
            if (child.symbol === symbol) {
                break;
            }
        }
        if (i === oldChildren.length) {
            child = cloneOnlyTree(symbol.view);
        }

        child.parent = node;
        if (lastChild && lastChild.children.length && child.children.length) {
            var left = node.children[treeI(child) - 1];
            var right = node.children[treeI(lastChild) + 1];
            var useLeft = left && left.divider && _.contains(oldChildren, left);
            var useRight = right && right.divider && _.contains(oldChildren, right);
            var divider = (
                useLeft && left ||
                useRight && right
            )
            if (divider) {
                oldChildren = _.without(oldChildren, divider);
            } else {
                divider = createView(null);
            }
            divider.parent = node;
            newChildren.push(divider);
        }

        if (i !== oldChildren.length) {
            oldChildren.splice(i, 1);
        }
        newChildren.push(child);
    });
    node.children = newChildren;
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

var viewsFromTree = function () {
    var views = [];
    _viewsFromTree(allViewTree, views);
    return views;
};

var _viewsFromTree = function (node, views) {
    _.each(node.children, function (child) {
        views.push(child);
        _viewsFromTree(child, views);
    });
};

var leftmostLeaf = function (node) {
    var visited = [];
    while (true) {
        if (_.contains(visited, node)) {
            return infiniteRecursionSymbol;
        }
        if (node.leaf) {
            return node;
        }
        visited.push(node);
        node = node.children[0];
    }
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

var siblingSymbol = function (node, delta) {
    var dir = delta > 0 ? +1 : -1;
    var siblings = node.parent.children;
    for (var i = treeI(node); i >= 0 && i < siblings.length; i += dir) {
        var sib = siblings[i];
        if (sib.symbol) {
            if (delta === 0) {
                return sib;
            }
            delta -= dir;
        }
    }
    return null;
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
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];
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

var cloneTreeAndSymbols = function (originalNode) {
    var toClone = {};
    symbolsToClone(originalNode, toClone);
    clonedSymbols = _.reduce(toClone, function (cloned, symbol, id) {
        cloned[id] = createSymbol(_.pick(symbol, 'text'));
        return cloned;
    }, {});
    return _cloneTreeAndSymbols(originalNode, clonedSymbols);
};

var symbolsToClone = function (node, toClone) {
    if (!node.reference) {
        toClone[node.symbol.id] = node.symbol;
    }
    if (node.branch) {
        _.each(node.children, function (child) {
            symbolsToClone(child, toClone);
        });
    }
};

var _cloneTreeAndSymbols = function (originalNode, clonedSymbols) {
    var node = _.clone(originalNode);
    node.id = viewId();
    node.symbol = clonedSymbols[node.symbol.id] || node.symbol;
    if (node.branch) {
        node.children = _.map(node.children, function (child) {
            child = _cloneTreeAndSymbols(child, clonedSymbols);
            child.parent = node;
            return child;
        });
        update(node);
    }
    return node;
};

var cloneOnlyTree = function (originalNode) {
    var node = _.clone(originalNode);
    node.id = viewId();
    if (node.branch) {
        node.children = _.map(node.children, function (child) {
            child = cloneOnlyTree(child);
            child.parent = node;
            return child;
        });
    }
    return node;
};
