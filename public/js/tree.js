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
    if (mode === 'token') {
        treeFromTokens();
    }
    if (mode === 'symbol') {
        tokensFromTree();
    }
    linkTokens(allTokens);
    linkTree(allSymbolTree, 0);
    barsFromTree();
    allSymbols = allBars.concat(allTokens);
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
    var maybeAttachBar = function (endI) {
        if (childBeginI != null) {
            maybeAttach(recurse(childBeginI, endI));
        }
    };
    var recurse = function (beginI, endI) {
        return _treeFromTokens(tokens.slice(beginI, endI), level + 1);
    };
    var maybeAttach = function (child) {
        if (child) {
            if (child.separator) {
                child.parent = node;
            } else {
                node.children.push(child);
            }
        }
    };

    _.each(tokens, function (token, i) {
        if (token.level === node.level + 1) {
            maybeAttachBar(i);
            childBeginI = null;
            maybeAttach(token);
        } else {
            if (childBeginI == null) {
                childBeginI = i;
            }
        }
    });
    maybeAttachBar(tokens.length);

    if (!node.children.length) {
        return null;
    }
    return node;
};

var tokensFromTree = function () {
    removeEmptySymbols(allSymbolTree);
    allTokens = [];
    _tokensFromTree(allSymbolTree, 0);
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

var linkTree = function (node, level) {
    var begin = node.children[0];
    var end = node.children[node.children.length - 1];
    var depth = 1;
    markSeparators(node.children);
    _.each(node.children, function (child, i) {
        child.parent = node;
        child.treeI = i;
        child.level = level + 1;
        if (child.bar) {
            var ret = linkTree(child, level + 1);
            depth = Math.max(depth, ret[2] + 1);
            if (i === 0) { begin = ret[0]; }
            if (i === node.children.length - 1) { end = ret[1]; }
        }
    });
    node.begin = begin;
    node.end = end;
    node.depth = depth;
    return [begin, end, depth];
};

var markSeparators = function (children) {
    var lastChild = null;
    _.each(children, function (child) {
        child.separatorLeft = child.separatorRight = false;
        if (lastChild && lastChild.bar && child.bar) {
            lastChild.separatorRight = true;
            child.separatorLeft = true;
        }
        lastChild = child;
    });
}

var _tokensFromTree = function (node, level) {
    markSeparators(node.children);
    _.each(node.children, function (child, i) {
        var token;
        if (child.token) {
            token = child;
        } else if (child.separatorLeft) {
            token = createToken({
                separator: true,
                level: level + 1,
                parent: node,
            });
        }
        if (token) {
            allTokens.push(token);
        }
        if (child.bar) {
            _tokensFromTree(child, level + 1);
        }
    });
};

var barsFromTree = function () {
    allBars = [allSymbolTree];
    _barsFromTree(allSymbolTree);
};

var _barsFromTree = function (node) {
    _.each(node.children, function (child) {
        if (child.bar) { allBars.push(child) }
    });
    _.each(node.children, function (child) {
        if (child.bar) { _barsFromTree(child) }
    });
};

var key = function (s) { return s.id };
