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
        barrier: false,
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
    barsFromTree();
    allSymbols = allTokens.concat(allBars);
};

var treeFromTokens = function () {
    _.each(allTokens, function (t, i) { t.tokenI = i });

    allSymbolTree = createBar({
        level: 0,
        begin: allTokens[0],
        end: allTokens[allTokens.length - 1],
    });

    _treeFromTokens(allSymbolTree, allTokens);
};

var _treeFromTokens = function (node, tokens) {
    var child = null;
    var attachChild = function (child) {
        child.parent = node;
        child.treeI = node.children.length;
        node.children.push(child);
        if (child.bar) {
            var childTokens = allTokens.slice(child.begin.tokenI, child.end.tokenI + 1);
            _treeFromTokens(child, childTokens);
        }
    };
    _.each(tokens, function (token) {
        var startChild;
        if (token.level === node.level + 1) {
            if (child) {
                attachChild(child);
                child = null;
            }
            attachChild(token);
        } else {
            if (!child) {
                child = createBar({
                    level: node.level + 1,
                    begin: token,
                });
            }
        }
        if (child) {
            child.end = token;
        }
    });
    if (child) {
        attachChild(child);
    }
};

var tokensFromTree = function () {
    allTokens = [];
    removeEmptySymbols(allSymbolTree);
    _tokensFromTree(allSymbolTree, 0, 1);
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

var _tokensFromTree = function (node, tokenI, level) {
    var begin = node.children[0];
    var end = node.children[node.children.length - 1];
    _.each(node.children, function (child, i) {
        if (child.token) {
            child.tokenI = tokenI;
            tokenI += 1;
            allTokens.push(child);
        } else {
            var ret = _tokensFromTree(child, tokenI, level + 1);
            tokenI = ret[0];
            if (i === 0) { begin = ret[1] }
            if (i === node.children.length) { end = ret[2] }
        }
    });
    _.each(node.children, function (child, i) {
        child.parent = node;
        child.level = level;
        child.treeI = i;
    });
    node.begin = begin;
    node.end = end;
    return [tokenI, begin, end];
};

var barsFromTree = function () {
    allBars = [allSymbolTree];
    _barsFromTree(allSymbolTree);
    allBars.reverse();
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

