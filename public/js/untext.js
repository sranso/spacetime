//window.untext = (function () {

var untext, allSymbols, allViewTree, otherPositions, symbolIdSequence, viewIdSequence, state, lastState, infiniteRecursionSymbol, insertingReferenceSymbol;

var init = function () {
    untext = {};
    allSymbols = [];
    otherPositions = {};
    symbolIdSequence = 1;
    viewIdSequence = 1;
    hovering = null;
    hoveringMode = null;
    mouse = [0, 0];
    stateInit();
};

var setup = function (example) {
    init();
    drawSetup();

    if (example) {
        loadJSON(example);
    } else {
        blankSetup();
    }

    console.log('untext loaded');
};

var blankSetup = function () {
    infiniteRecursionSymbol = createSymbol({text: '[Infinite recursion]'});
    infiniteRecursionSymbol.view = createView(infiniteRecursionSymbol);
    insertingReferenceSymbol = createSymbol({text: ''});
    insertingReferenceSymbol.view = createView(insertingReferenceSymbol);
    var root = createSymbol({children: [
        createSymbol({children: [
            createSymbol({text: 'fibonaci'}),
        ]}),
    ]});
    linkSymbols(root);
    allViewTree = root.view;

    updateState({
        hovering: null,
        inserting: null,
        moving: null,
        selection: null,
        doStructure: true,
        doHovering: true,
    });
    doStuffAfterStateChanges();
};

var linkSymbols = function (node) {
    node.view = createView(node);
    node.view.children = _.map(node.children, function (child) {
        child.parents = [node];
        linkSymbols(child);
        child.view.parent = node.view;
        if (child.leaf) {
            return child.view;
        }
        var reference = createView(child, {
            reference: true,
            parent: node.view,
        });
        return reference;
    });
    if (node.children.length) {
        node.text = node.children[0].text;
        node.textWidth = node.children[0].textWidth;
    }
};


var prepJSON = function () {
    var v = _prepViewsJSON();
    var s = _prepSymbolsJSON(allSymbols);
    return _.extend(v, s);
};

var _prepViewsJSON = function () {
    var viewTable = {};
    _viewTableFromTree(allViewTree, viewTable);
    _.each(allSymbols, function (symbol) {
        if (symbol.view) {                          // TODO: find bug where symbol has no view.
            viewTable[symbol.view.id] = symbol.view;
        }
    });
    var views = _.map(viewTable, function (view) {
        return _prepViewNodeJSON(view);
    });
    return {
        views: views,
        viewTreeRoot: allViewTree.id,
    };
};

var _viewTableFromTree = function (node, viewTable) {
    viewTable[node.id] = node;
    _.each(node.children, function (child) {
        _viewTableFromTree(child, viewTable);
    });
};

var _prepViewNodeJSON = function (view) {
    var json = _.pick(view, 'id', 'reference');
    json.symbol = view.symbol && view.symbol.id;
    json.children = _.pluck(view.children, 'id');
    json.parent = view.parent && view.parent.id;
    return json;
};

var _prepSymbolsJSON = function (symbols) {
    var jsonSymbols = _.map(symbols, function (symbol) {
        var json = _.pick(symbol, 'id', 'alive', 'text', 'name');
        json.parents = _.pluck(symbol.parents, 'id');
        json.children = _.pluck(symbol.children, 'id');
        json.view = symbol.view && symbol.view.id;  // TODO: find bug where symbol has no view.
        return json;
    });
    return {
        symbols: jsonSymbols,
        infiniteRecursionSymbol: infiniteRecursionSymbol.id,
        insertingReferenceSymbol: insertingReferenceSymbol.id,
    };
};

var dumpJSON = function () {
    var json = prepJSON();
    return JSON.stringify(json);
};


var loadJSONString = function (text) {
    loadJSON(JSON.parse(text));
};

var loadJSON = function (json) {
    symbolTable = _loadSymbolsJSON(json);
    viewTable = _loadViewJSON(json, symbolTable);
    _loadSymbolViews(viewTable);
    _loadIdSequences(viewTable);

    allViewTree = viewTable[json.viewTreeRoot];
    infiniteRecursionSymbol = symbolTable[json.infiniteRecursionSymbol];
    insertingReferenceSymbol = symbolTable[json.insertingReferenceSymbol];

    updateState({
        hovering: null,
        inserting: null,
        moving: null,
        selection: null,
        doStructure: true,
        doHovering: true,
    });
    doStuffAfterStateChanges();
};

var _loadSymbolsJSON = function (json) {
    allSymbols = [];
    var symbolTable = {};
    _.each(json.symbols, function (json) {
        var symbol = createSymbol(json);
        symbolTable[symbol.id] = symbol;
    });
    var lookup = function (id) { return symbolTable[id] };
    _.each(allSymbols, function (symbol) {
        symbol.parents = _.map(symbol.parents, lookup);
        symbol.children = _.map(symbol.children, lookup);
    });
    return symbolTable;
};

var _loadViewJSON = function (json, symbolTable) {
    var viewTable = {};
    var views = _.map(json.views, function (json) {
        var symbol = symbolTable[json.symbol];
        var view = createView(symbol, _.omit(json, 'symbol'));
        viewTable[view.id] = view;
        return view;
    });
    var lookup = function (id) { return viewTable[id] };
    _.each(views, function (view) {
        view.children = _.map(view.children, lookup);
        view.parent = view.parent && lookup(view.parent);
    });
    return viewTable;
};

var _loadSymbolViews = function (viewTable) {
    _.each(allSymbols, function (symbol) {
        symbol.view = symbol.view && viewTable[symbol.view];
    });
};

var _loadIdSequences = function (viewTable) {
    viewIdSequence = 0;
    _.each(viewTable, function (view) {
        viewIdSequence = Math.max(viewIdSequence, view.id + 1);
    });
    symbolIdSequence = 0;
    _.each(allSymbols, function (symbol) {
        symbolIdSequence = Math.max(symbolIdSequence, symbol.id + 1);
    });
};


var example1 = {"views":[{"id":1,"reference":false,"symbol":2,"children":[],"parent":null},{"id":2,"reference":false,"symbol":1,"children":[41],"parent":null},{"id":4,"reference":false,"symbol":3,"children":[],"parent":3},{"id":8,"reference":false,"symbol":5,"children":[],"parent":6},{"id":9,"reference":false,"symbol":6,"children":[],"parent":10},{"id":10,"reference":false,"symbol":7,"children":[9],"parent":6},{"id":12,"reference":false,"symbol":8,"children":[],"parent":13},{"id":14,"reference":false,"symbol":10,"children":[],"parent":15},{"id":15,"reference":false,"symbol":11,"children":[14,16,17],"parent":13},{"id":16,"reference":false,"symbol":12,"children":[],"parent":15},{"id":17,"reference":false,"symbol":13,"children":[],"parent":15},{"id":19,"reference":false,"symbol":14,"children":[],"parent":20},{"id":20,"reference":false,"symbol":15,"children":[19,21],"parent":13},{"id":21,"reference":false,"symbol":16,"children":[],"parent":20},{"id":23,"reference":false,"symbol":17,"children":[],"parent":24},{"id":25,"reference":false,"symbol":19,"children":[],"parent":27},{"id":28,"reference":false,"symbol":22,"children":[],"parent":29},{"id":29,"reference":false,"symbol":23,"children":[28,30,31],"parent":27},{"id":30,"reference":false,"symbol":24,"children":[],"parent":29},{"id":31,"reference":false,"symbol":25,"children":[],"parent":29},{"id":32,"reference":false,"symbol":26,"children":[],"parent":26},{"id":33,"reference":false,"symbol":27,"children":[],"parent":34},{"id":35,"reference":false,"symbol":29,"children":[],"parent":36},{"id":36,"reference":false,"symbol":30,"children":[35,37,38],"parent":34},{"id":37,"reference":false,"symbol":31,"children":[],"parent":36},{"id":38,"reference":false,"symbol":32,"children":[],"parent":36},{"id":41,"reference":false,"symbol":4,"children":[42,43,44,77,47],"parent":2},{"id":42,"reference":false,"symbol":3,"children":[],"parent":41},{"id":43,"reference":false,"symbol":5,"children":[],"parent":41},{"id":44,"reference":false,"symbol":7,"children":[45],"parent":41},{"id":45,"reference":false,"symbol":6,"children":[],"parent":44},{"id":47,"reference":false,"symbol":9,"children":[48,49,78,54,79,58],"parent":41},{"id":48,"reference":false,"symbol":8,"children":[],"parent":47},{"id":49,"reference":false,"symbol":11,"children":[50,51,52],"parent":47},{"id":50,"reference":false,"symbol":10,"children":[],"parent":49},{"id":51,"reference":false,"symbol":12,"children":[],"parent":49},{"id":52,"reference":false,"symbol":13,"children":[],"parent":49},{"id":54,"reference":false,"symbol":15,"children":[55,56],"parent":47},{"id":55,"reference":false,"symbol":14,"children":[],"parent":54},{"id":56,"reference":false,"symbol":16,"children":[],"parent":54},{"id":58,"reference":false,"symbol":18,"children":[59,60],"parent":47},{"id":59,"reference":false,"symbol":17,"children":[],"parent":58},{"id":60,"reference":false,"symbol":20,"children":[61,67,68],"parent":58},{"id":61,"reference":false,"symbol":21,"children":[115,63],"parent":60},{"id":63,"reference":false,"symbol":23,"children":[64,65,66],"parent":61},{"id":64,"reference":false,"symbol":22,"children":[],"parent":63},{"id":65,"reference":false,"symbol":24,"children":[],"parent":63},{"id":66,"reference":false,"symbol":25,"children":[],"parent":63},{"id":67,"reference":false,"symbol":26,"children":[],"parent":60},{"id":68,"reference":false,"symbol":28,"children":[80,70],"parent":60},{"id":70,"reference":false,"symbol":30,"children":[71,72,73],"parent":68},{"id":71,"reference":false,"symbol":29,"children":[],"parent":70},{"id":72,"reference":false,"symbol":31,"children":[],"parent":70},{"id":73,"reference":false,"symbol":32,"children":[],"parent":70},{"id":77,"reference":false,"symbol":null,"children":[],"parent":41},{"id":78,"reference":false,"symbol":null,"children":[],"parent":47},{"id":79,"reference":false,"symbol":null,"children":[],"parent":47},{"id":80,"reference":true,"symbol":4,"children":[],"parent":68},{"id":115,"reference":true,"symbol":4,"children":[],"parent":61}],"viewTreeRoot":2,"symbols":[{"id":1,"alive":true,"text":null,"parents":[],"children":[4],"view":2},{"id":2,"alive":true,"text":"[Infinite recursion]","parents":[],"children":[],"view":1},{"id":3,"alive":true,"text":"fibonaci","parents":[4],"children":[],"view":4},{"id":4,"alive":true,"text":null,"parents":[1,21,28],"children":[3,5,7,9],"view":41},{"id":5,"alive":true,"text":"function","parents":[4],"children":[],"view":8},{"id":6,"alive":true,"text":"n","parents":[7],"children":[],"view":9},{"id":7,"alive":true,"text":null,"parents":[4],"children":[6],"view":10},{"id":8,"alive":true,"text":"if","parents":[9],"children":[],"view":12},{"id":9,"alive":true,"text":null,"parents":[4],"children":[8,11,15,18],"view":47},{"id":10,"alive":true,"text":"n","parents":[11],"children":[],"view":14},{"id":11,"alive":true,"text":null,"parents":[9],"children":[10,12,13],"view":15},{"id":12,"alive":true,"text":"<","parents":[11],"children":[],"view":16},{"id":13,"alive":true,"text":"2","parents":[11],"children":[],"view":17},{"id":14,"alive":true,"text":"return","parents":[15],"children":[],"view":19},{"id":15,"alive":true,"text":null,"parents":[9],"children":[14,16],"view":20},{"id":16,"alive":true,"text":"1","parents":[15],"children":[],"view":21},{"id":17,"alive":true,"text":"return","parents":[18],"children":[],"view":23},{"id":18,"alive":true,"text":null,"parents":[9],"children":[17,20],"view":58},{"id":19,"alive":true,"text":"function","parents":[],"children":[],"view":25},{"id":20,"alive":true,"text":null,"parents":[18],"children":[21,26,28],"view":60},{"id":21,"alive":true,"text":null,"parents":[20],"children":[4,23],"view":61},{"id":22,"alive":true,"text":"n","parents":[23],"children":[],"view":28},{"id":23,"alive":true,"text":null,"parents":[21],"children":[22,24,25],"view":29},{"id":24,"alive":true,"text":"-","parents":[23],"children":[],"view":30},{"id":25,"alive":true,"text":"1","parents":[23],"children":[],"view":31},{"id":26,"alive":true,"text":"+","parents":[20],"children":[],"view":32},{"id":27,"alive":true,"text":"function","parents":[],"children":[],"view":33},{"id":28,"alive":true,"text":null,"parents":[20],"children":[4,30],"view":68},{"id":29,"alive":true,"text":"n","parents":[30],"children":[],"view":35},{"id":30,"alive":true,"text":null,"parents":[28],"children":[29,31,32],"view":36},{"id":31,"alive":true,"text":"-","parents":[30],"children":[],"view":37},{"id":32,"alive":true,"text":"2","parents":[30],"children":[],"view":38}],"specialSymbols":{"infiniteRecursion":2}};


setup(null);

//return untext;

//})();
