//window.untext = (function () {

var untext, allSymbols, allViewTree, otherPositions, symbolIdSequence, viewIdSequence, state, lastState, infiniteRecursionSymbol, insertingReferenceSymbol, undoHistory;

var init = function () {
    untext = {};
    allSymbols = [];
    otherPositions = {};
    symbolIdSequence = 1;
    viewIdSequence = 1;
    hovering = null;
    hoveringMode = null;
    mouse = [0, 0];
    undoHistory = [];
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
    saveUndo();
    saveUndo();

    console.log('untext loaded');
};

var blankSetup = function () {
    infiniteRecursionSymbol = createSymbol({leaf: true, text: '[Infinite recursion]'});
    infiniteRecursionSymbol.view = createView(infiniteRecursionSymbol);
    insertingReferenceSymbol = createSymbol({leaf: true});
    insertingReferenceSymbol.view = createView(insertingReferenceSymbol);
    var root = createSymbol({children: [
        createSymbol({children: [
            createSymbol({leaf: true, text: 'fibonaci'}),
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


var saveUndo = function () {
    if (undoHistory.length >= 40) {
        undoHistory.shift();
    }
    undoHistory.push(dumpJSON());
};

var recoverUndo = function () {
    if (undoHistory.length < 2) {
        return;
    }
    undoHistory.pop();
    loadJSONString(undoHistory[undoHistory.length - 1]);
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
            _viewTableFromTree(symbol.view, viewTable);
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
        var json = _.pick(symbol, 'id', 'alive', 'text', 'leaf');
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


var example1 = {"views":[{"id":1,"reference":false,"symbol":1,"children":[],"parent":null},{"id":3,"reference":false,"symbol":5,"children":[7],"parent":null},{"id":5,"reference":false,"symbol":3,"children":[]},{"id":7,"reference":false,"symbol":4,"children":[8,23,25,35,36],"parent":3},{"id":8,"reference":false,"symbol":3,"children":[],"parent":7},{"id":10,"reference":false,"symbol":6,"children":[11,13],"parent":7},{"id":11,"reference":false,"symbol":7,"children":[],"parent":10},{"id":13,"reference":false,"symbol":8,"children":[14,21],"parent":10},{"id":14,"reference":false,"symbol":9,"children":[],"parent":13},{"id":17,"reference":false,"symbol":11,"children":[]},{"id":20,"reference":true,"symbol":10,"children":[],"parent":21},{"id":21,"reference":false,"symbol":10,"children":[22,20],"parent":13},{"id":22,"reference":false,"symbol":11,"children":[],"parent":21},{"id":23,"reference":true,"symbol":6,"children":[],"parent":7},{"id":25,"reference":false,"symbol":12,"children":[34],"parent":7},{"id":26,"reference":false,"symbol":13,"children":[27,33],"parent":25},{"id":27,"reference":false,"symbol":14,"children":[],"parent":26},{"id":29,"reference":false,"symbol":15,"children":[30,31],"parent":26},{"id":30,"reference":false,"symbol":16,"children":[],"parent":29},{"id":31,"reference":true,"symbol":8,"children":[],"parent":29},{"id":33,"reference":true,"symbol":15,"children":[],"parent":26},{"id":34,"reference":true,"symbol":13,"children":[],"parent":25},{"id":35,"reference":false,"symbol":null,"children":[],"parent":7},{"id":36,"reference":false,"symbol":17,"children":[43,45,66,129],"parent":7},{"id":37,"reference":false,"symbol":18,"children":[38,39],"parent":36},{"id":38,"reference":false,"symbol":19,"children":[],"parent":37},{"id":39,"reference":true,"symbol":8,"children":[],"parent":37},{"id":42,"reference":false,"symbol":20,"children":[],"parent":36},{"id":43,"reference":true,"symbol":18,"children":[],"parent":36},{"id":44,"reference":true,"symbol":13,"children":[],"parent":45},{"id":45,"reference":false,"symbol":21,"children":[44,56,57],"parent":36},{"id":47,"reference":false,"symbol":22,"children":[48,49,55],"parent":45},{"id":48,"reference":false,"symbol":23,"children":[],"parent":47},{"id":49,"reference":true,"symbol":6,"children":[],"parent":47},{"id":51,"reference":false,"symbol":24,"children":[52,53],"parent":47},{"id":52,"reference":false,"symbol":25,"children":[],"parent":51},{"id":53,"reference":true,"symbol":10,"children":[],"parent":51},{"id":55,"reference":true,"symbol":24,"children":[],"parent":47},{"id":56,"reference":true,"symbol":22,"children":[],"parent":45},{"id":57,"reference":false,"symbol":26,"children":[],"parent":45},{"id":60,"reference":false,"symbol":27,"children":[],"parent":36},{"id":61,"reference":false,"symbol":28,"children":[62,63],"parent":60},{"id":62,"reference":false,"symbol":29,"children":[],"parent":61},{"id":63,"reference":true,"symbol":8,"children":[],"parent":61},{"id":66,"reference":false,"symbol":30,"children":[],"parent":36},{"id":70,"reference":false,"symbol":31,"children":[],"parent":36},{"id":71,"reference":true,"symbol":4,"children":[],"parent":73},{"id":73,"reference":false,"symbol":33,"children":[71,75]},{"id":74,"reference":true,"symbol":13,"children":[],"parent":75},{"id":75,"reference":false,"symbol":34,"children":[74,82,83],"parent":73},{"id":77,"reference":false,"symbol":35,"children":[78,79,80],"parent":75},{"id":78,"reference":false,"symbol":36,"children":[],"parent":77},{"id":79,"reference":true,"symbol":6,"children":[],"parent":77},{"id":80,"reference":true,"symbol":24,"children":[],"parent":77},{"id":82,"reference":true,"symbol":35,"children":[],"parent":75},{"id":83,"reference":false,"symbol":37,"children":[],"parent":75},{"id":86,"reference":false,"symbol":38,"children":[87,88,89]},{"id":87,"reference":false,"symbol":39,"children":[],"parent":86},{"id":88,"reference":true,"symbol":6,"children":[],"parent":86},{"id":89,"reference":true,"symbol":24,"children":[],"parent":86},{"id":90,"reference":true,"symbol":4,"children":[],"parent":92},{"id":92,"reference":false,"symbol":40,"children":[90,94]},{"id":93,"reference":true,"symbol":13,"children":[],"parent":94},{"id":94,"reference":false,"symbol":41,"children":[93,95,97],"parent":92},{"id":95,"reference":true,"symbol":35,"children":[],"parent":94},{"id":97,"reference":false,"symbol":42,"children":[],"parent":94},{"id":98,"reference":true,"symbol":2,"children":[],"parent":94},{"id":100,"reference":false,"symbol":32,"children":[116,107,122],"parent":70},{"id":107,"reference":true,"symbol":38,"children":[],"parent":100},{"id":116,"reference":false,"symbol":33,"children":[117,118],"parent":100},{"id":117,"reference":true,"symbol":4,"children":[],"parent":116},{"id":118,"reference":false,"symbol":34,"children":[119,120,121],"parent":116},{"id":119,"reference":true,"symbol":13,"children":[],"parent":118},{"id":120,"reference":true,"symbol":35,"children":[],"parent":118},{"id":121,"reference":false,"symbol":37,"children":[],"parent":118},{"id":122,"reference":false,"symbol":40,"children":[123,124],"parent":100},{"id":123,"reference":true,"symbol":4,"children":[],"parent":122},{"id":124,"reference":false,"symbol":41,"children":[125,126,127],"parent":122},{"id":125,"reference":true,"symbol":13,"children":[],"parent":124},{"id":126,"reference":true,"symbol":35,"children":[],"parent":124},{"id":127,"reference":false,"symbol":42,"children":[],"parent":124},{"id":129,"reference":false,"symbol":32,"children":[130,136,137],"parent":36},{"id":130,"reference":false,"symbol":33,"children":[131,132],"parent":129},{"id":131,"reference":true,"symbol":4,"children":[],"parent":130},{"id":132,"reference":false,"symbol":34,"children":[133,134,135],"parent":130},{"id":133,"reference":true,"symbol":13,"children":[],"parent":132},{"id":134,"reference":true,"symbol":35,"children":[],"parent":132},{"id":135,"reference":false,"symbol":37,"children":[],"parent":132},{"id":136,"reference":true,"symbol":38,"children":[],"parent":129},{"id":137,"reference":false,"symbol":40,"children":[138,139],"parent":129},{"id":138,"reference":true,"symbol":4,"children":[],"parent":137},{"id":139,"reference":false,"symbol":41,"children":[140,141,142],"parent":137},{"id":140,"reference":true,"symbol":13,"children":[],"parent":139},{"id":141,"reference":true,"symbol":35,"children":[],"parent":139},{"id":142,"reference":false,"symbol":42,"children":[],"parent":139}],"viewTreeRoot":3,"symbols":[{"id":1,"alive":true,"text":"[Infinite recursion]","leaf":true,"parents":[],"children":[],"view":1},{"id":2,"alive":true,"text":"","leaf":true,"parents":[],"children":[],"view":98},{"id":3,"alive":true,"text":"fibonaci","leaf":true,"parents":[4],"children":[],"view":5},{"id":4,"alive":true,"text":"fibonaci","leaf":false,"parents":[5,33,40],"children":[3,6,12,17],"view":7},{"id":5,"alive":true,"text":"fibonaci","leaf":false,"parents":[],"children":[4],"view":3},{"id":6,"alive":true,"text":"function","leaf":false,"parents":[4,22,35,38],"children":[7,8],"view":10},{"id":7,"alive":true,"text":"function","leaf":true,"parents":[6],"children":[],"view":11},{"id":8,"alive":true,"text":"keyword","leaf":false,"parents":[6,15,18,28],"children":[9,10],"view":13},{"id":9,"alive":true,"text":"keyword","leaf":true,"parents":[8],"children":[],"view":14},{"id":10,"alive":true,"text":"meta","leaf":false,"parents":[8,10,24],"children":[11,10],"view":21},{"id":11,"alive":true,"text":"meta","leaf":true,"parents":[10],"children":[],"view":17},{"id":12,"alive":true,"text":"n","leaf":false,"parents":[4],"children":[13],"view":25},{"id":13,"alive":true,"text":"n","leaf":false,"parents":[12,21,34,41],"children":[14,15],"view":26},{"id":14,"alive":true,"text":"n","leaf":true,"parents":[13],"children":[],"view":27},{"id":15,"alive":true,"text":"var","leaf":false,"parents":[13],"children":[16,8],"view":29},{"id":16,"alive":true,"text":"var","leaf":true,"parents":[15],"children":[],"view":30},{"id":17,"alive":true,"text":"if","leaf":false,"parents":[4],"children":[18,21,30,32],"view":36},{"id":18,"alive":true,"text":"if","leaf":false,"parents":[17],"children":[19,8],"view":37},{"id":19,"alive":true,"text":"if","leaf":true,"parents":[18],"children":[],"view":38},{"id":20,"alive":true,"text":"","leaf":false,"parents":[17],"children":[],"view":42},{"id":21,"alive":true,"text":"n","leaf":false,"parents":[17],"children":[13,22,26],"view":45},{"id":22,"alive":true,"text":"<","leaf":false,"parents":[21],"children":[23,6,24],"view":47},{"id":23,"alive":true,"text":"<","leaf":true,"parents":[22],"children":[],"view":48},{"id":24,"alive":true,"text":"builtin","leaf":false,"parents":[22,35,38],"children":[25,10],"view":51},{"id":25,"alive":true,"text":"builtin","leaf":true,"parents":[24],"children":[],"view":52},{"id":26,"alive":true,"text":"2","leaf":true,"parents":[21],"children":[],"view":57},{"id":27,"alive":true,"text":"1","leaf":false,"parents":[17],"children":[],"view":60},{"id":28,"alive":true,"text":"return","leaf":false,"parents":[],"children":[29,8],"view":61},{"id":29,"alive":true,"text":"return","leaf":true,"parents":[28],"children":[],"view":62},{"id":30,"alive":true,"text":"1","leaf":true,"parents":[17],"children":[],"view":66},{"id":31,"alive":true,"text":"fibonaci","leaf":false,"parents":[17],"children":[],"view":70},{"id":32,"alive":true,"text":"fibonaci","leaf":false,"parents":[17],"children":[33,38,40],"view":100},{"id":33,"alive":true,"text":"fibonaci","leaf":false,"parents":[32],"children":[4,34],"view":73},{"id":34,"alive":true,"text":"n","leaf":false,"parents":[33],"children":[13,35,37],"view":75},{"id":35,"alive":true,"text":"-","leaf":false,"parents":[34,41],"children":[36,6,24],"view":77},{"id":36,"alive":true,"text":"-","leaf":true,"parents":[35],"children":[],"view":78},{"id":37,"alive":true,"text":"1","leaf":true,"parents":[34],"children":[],"view":83},{"id":38,"alive":true,"text":"+","leaf":false,"parents":[32],"children":[39,6,24],"view":86},{"id":39,"alive":true,"text":"+","leaf":true,"parents":[38],"children":[],"view":87},{"id":40,"alive":true,"text":"fibonaci","leaf":false,"parents":[32],"children":[4,41],"view":92},{"id":41,"alive":true,"text":"n","leaf":false,"parents":[40],"children":[13,35,42],"view":94},{"id":42,"alive":true,"text":"2","leaf":true,"parents":[41],"children":[],"view":97}],"infiniteRecursionSymbol":1,"insertingReferenceSymbol":2};


setup(example1);

//return untext;

//})();
