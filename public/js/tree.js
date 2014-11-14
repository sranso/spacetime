var symbolId = function () {
    var id = symbolIdSequence;
    symbolIdSequence += 1;
    return id;
};

var createBar = function (bar) {
    return _.extend({
        id: symbolId(),
        symbol: true,
        bar: true,
        token: false,
        children: [],
        _children: [],
        level: 0,
        depth: 0,
        begin: null,
        end: null,
    }, bar);
};

var createToken = function (token) {
    return _.extend({
        id: symbolId(),
        symbol: true,
        bar: false,
        token: true,
        text: "",
        level: 0,
        depth: 0,
        separator: false,
        empty: false,
    }, token);
};

var computeStructure = function (mode) {
    if (!mode) {
        return;
    }
    if (mode === 'tower') {
        treeFromTokens();
    } else {
        tokensFromTree();
    }
    linkTokens(allTokens);
    linkTree(allSymbolTree, 0);
};

var treeFromTokens = function () {
    allSymbolTree = _treeFromTokens(allTokens, 0);
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
    removeEmptySymbols(allSymbolTree);
    addSeparatorsToChildren(allSymbolTree, 0);
    var symbols = symbolsFromTree(allSymbolTree);
    allTokens = _.filter(symbols, _.property('token'));
};

var removeEmptySymbols = function (node) {
    node.children = _.filter(node.children, function (child) {
        if (child.bar) {
            removeEmptySymbols(child);
            return child.children.length > 0;
        } else {
            return true;
        }
    });
};

var markSeparators = function (children) {
    var lastChild = null;
    _.each(children, function (child, i) {
        child.separatorLeft = child.separatorRight = false;
        if (lastChild && lastChild.bar && child.bar) {
            lastChild.separatorRight = true;
            child.separatorLeft = true;
        }
        lastChild = child;
    });
};

var linkTree = function (node, level) {
    var begin = node._children[0];
    var end = node._children[node._children.length - 1];
    var depth = 1;
    node.children = _.filter(node._children, function (child, i) {
        child.parent = node;
        child.level = level + 1;
        if (child.bar) {
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

var addSeparatorsToChildren = function (node) {
    markSeparators(node.children);
    var _children = [];
    _.each(node.children, function (child, i) {
        if (child.separatorLeft) {
            var token = createToken({separator: true});
            _children.push(token);
        }
        _children.push(child);
        if (child.bar) {
            addSeparatorsToChildren(child);
        }
    });
    node._children = _children;
};

var symbolsFromTree = function (node) {
    var symbols = [];
    _symbolsFromTree(node, symbols);
    return symbols;
};

var _symbolsFromTree = function (node, symbols) {
    symbols.push(node);
    if (node.bar) {
        _.each(node._children, function (child) {
            _symbolsFromTree(child, symbols);
        });
    }
};

var findUnderMouse = function () {
    return findFromCoordinates(mouse[0], mouse[1]);
};

var findFromCoordinates = function (x, y) {
    return _findFromCoordinates({_children: [allSymbolTree]}, x, y);
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
