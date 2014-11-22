var symbolId = function () {
    var id = symbolIdSequence;
    symbolIdSequence += 1;
    return id;
};

var displayId = function () {
    var id = displayIdSequence;
    displayIdSequence += 1;
    return id;
};

var createDisplay = function (symbol, display) {
    display = _.extend({
        id: displayId(),
        token: !symbol || symbol.leaf,
        reference: false,
        separator: !symbol,
        separatorLeft: false,
        separatorRight: false,
        symbol: symbol,
        children: [],
        _children: [],
        text: '',
        level: 0,
        depth: 0,
        position: null,
        begin: null,
        end: null,
        parent: null,
        treeI: 0,
        tokenI: 0,
    }, display || {});
    display.branch = !display.token;
    return display;
};

var createSymbol = function (symbol) {
    var leaf = _.has(symbol, 'text');
    return _.extend({
        id: symbolId(),
        alive: true,
        leaf: leaf,
        branch: !leaf,
        children: [],
        parents: [],
        text: '',
        display: null,
    }, symbol);
};

var updateSymbols = function (displayNodes) {
    _.each(displayNodes, updateSymbol);
};

var updateSymbol = function (displayNode) {
    var symbol = displayNode.symbol;
    var newChildren = _.pluck(displayNode.children, 'symbol');
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
    symbol.text = displayNode.text;
    symbol.display = displayNode;
    if (!newChildren.length) {
        killSymbol(symbol);
    }
};

var killSymbol = function (symbol) {
    _.each(symbol.parents, function (parent) {
        parent.children = _.without(parent.children, symbol);
        if (!parent.children.length) {
            killSymbol(parent);
        }
    });
};

// TODO
var computeStructure = function (mode) {
    updateDisplay();
};

var updateDisplay = function (displayTree) {
    allDisplayTree = displayTree || allDisplayTree;
    _updateDisplay(allDisplayTree);
    tokensFromTree();
    linkTokens(allTokens);
    linkTree(allDisplayTree, 0);
    updateState({
        doStructure: false,
        doPositions: true,
        doDataDraw: true,
    });
};

// TODO: what to about the oddball separators?
var _updateDisplay = function (node) {
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
                return symbol.display;
            }
            oldChildren.splice(i, 1);
            _updateDisplay(child);
            return child;
        });
        node.text = symbol.text;
    }
};

var linkTree = function (node, level) {
    var begin = node._children[0];
    var end = node._children[node._children.length - 1];
    var depth = 1;
    node.children = _.filter(node._children, function (child, i) {
        child.parent = node;
        child.level = level + 1;
        if (child.branch) {
            var ret = linkTree(child, level + 1);
            depth = Math.max(depth, ret[2] + 1);
            if (i === 0) { begin = ret[0]; }
            if (i === node._children.length - 1) { end = ret[1]; }
        }
        return !child.separator;
    });
    markSeparators(node.children);

    _.each(node.children, function (child, i) {
        child.treeI = i;
    });
    node.begin = begin;
    node.end = end;
    node.depth = depth;
    return [begin, end, depth];
};

var markSeparators = function (children) {
    var lastChild = null;
    _.each(children, function (child, i) {
        child.separatorLeft = child.separatorRight = false;
        if (lastChild && lastChild.branch && child.branch) {
            lastChild.separatorRight = true;
            child.separatorLeft = true;
        }
        lastChild = child;
    });
};


//var computeStructure = function (mode) {
//    if (!mode) {
//        return;
//    }
//    if (mode === 'tower') {
//        treeFromTokens();
//    } else {
//        tokensFromTree();
//    }
//    linkTokens(allTokens);
//    linkTree(allDisplayTree, 0);
//    updateState({
//        doStructure: false,
//        doPositions: true,
//        doDataDraw: true,
//    });
//};

var treeFromTokens = function () {
    allDisplayTree = _treeFromTokens(allTokens, 0);
};

var linkTokens = function (tokens) {
    _.each(tokens, function (t, i) { t.tokenI = i });
};

var _treeFromTokens = function (tokens, level) {
    var node = createBar({level: level});
    var childBeginI = null;
    var attachBar = function (endI) {
        if (childBeginI != null) {
            attach(recurse(childBeginI, endI));
        }
    };
    var recurse = function (beginI, endI) {
        return _treeFromTokens(tokens.slice(beginI, endI), level + 1);
    };
    var attach = function (child) {
        if (child) {
            node._children.push(child);
        }
    };

    _.each(tokens, function (token, i) {
        if (token.level === node.level + 1) {
            attachBar(i);
            childBeginI = null;
            attach(token);
        } else {
            if (childBeginI == null) {
                childBeginI = i;
            }
        }
    });
    attachBar(tokens.length);

    return node;
};

var tokensFromTree = function () {
    addSeparatorsToChildren(allDisplayTree, 0);
    var symbols = symbolsFromTree();
    allTokens = _.filter(symbols, _.property('token'));
};

var addSeparatorsToChildren = function (node) {
    markSeparators(node.children);
    var _children = [];
    _.each(node.children, function (child, i) {
        if (child.separatorLeft) {
            var token = createDisplay(null, {separator: true});
            _children.push(token);
        }
        _children.push(child);
        if (child.branch) {
            addSeparatorsToChildren(child);
        }
    });
    node._children = _children;
};

var symbolsFromTree = function () {
    var symbols = [];
    _symbolsFromTree(allDisplayTree, symbols);
    return symbols;
};

var _symbolsFromTree = function (node, symbols) {
    _.each(node._children, function (child) {
        symbols.push(child);
        _symbolsFromTree(child, symbols);
    });
};

var findUnderMouse = function () {
    return findFromCoordinates(mouse[0], mouse[1]);
};

var findFromCoordinates = function (x, y) {
    return _findFromCoordinates({_children: [allDisplayTree]}, x, y);
};

var _findFromCoordinates = function (node, x, y) {
    var ifNotFound = null;
    for (var i = 0; i < node._children.length; i++) {
        var child = node._children[i];
        if (child.x <= x && x <= child.x + child.w && y >= child.y) {
            if (child.token) {
                if (y >= child.y + child.symbolEndY) {
                    return [child, 'tower'];
                } else {
                    if (child.separator) {
                        ifNotFound = [child, 'tower'];
                    } else {
                        return [child, 'symbol'];
                    }
                }
            } else {
                if (y < child.y + child.symbolEndY) {
                    return [child, 'symbol'];
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

var cloneTree = function (node) {
    var cNode = _.clone(node);
    cNode.id = symbolId();
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
