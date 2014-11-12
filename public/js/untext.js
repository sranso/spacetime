//window.untext = (function () {

var SEPARATOR = 1;
var EMPTY = 2;

var untext, allSymbolTree, allTokens, symbolIdSequence, offCameraToken, camera,
    moving, hovering, mouse, hoveringMode, movingMode;

var init = function () {
    untext = {};
    allSymbolTree = null;
    allTokens = [];
    symbolIdSequence = 0;
    moving = null;
    hovering = null;
    hoveringMode = null;
    movingMode = null;
    mouse = [0, 0];
    keyInit();
};

var setup = function (data) {
    init();
    allTokens = data.tokens;
    symbolIdSequence = data.symbolIdSequence;
    drawSetup();

    console.log('untext loaded');
};

var setupExample = function (example) {
    symbolIdSequence = 0;
    setup({
        tokens: _.map(example.tokens, function (config, i) {
            return createToken({
                text: _.isString(config[0]) ? config[0] : '',
                separator: config[0] === SEPARATOR,
                empty: config[0] === EMPTY,
                level: config[1],
            });
        }),
        symbolIdSequence: example.tokens.length,
    });
};

var example1 = {
    tokens: [['function', 1], ['addSym', 1], ['list', 2], ['symbol', 2], [SEPARATOR, 1], ['list', 2], ['.', 2], ['append', 2], ['symbol', 3], ['.', 3], ['createEl', 3], [EMPTY, 3]],
};

var example2 = {
    tokens: [['class', 1], ['Table', 1], ['function', 2], ['fibonaci', 2], ['n', 3], [SEPARATOR, 2], ['if', 3], ['n', 4], ['<', 4], ['2', 4], [SEPARATOR, 3], ['return', 4], ['1', 4], [SEPARATOR, 3], ['return', 4], ['fibonaci', 6], ['n', 7], ['-', 7], ['1', 7], ['+', 5], ['fibonaci', 6], ['n', 7], ['-', 7], ['2', 7]],
};

setupExample(example2);


//return untext;

//})();
