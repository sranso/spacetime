//window.untext = (function () {

var BARRIER = 1;
var EMPTY = 2;
var width = '100%';
var height = 300;
var levelHeight = 20;
var gapWidth = 1;
var gapHeight = 6;
var minMoveX = 15;

var untext, allSymbolTree, allSymbols, allBars, allTokens, symbolIdSequence, offCameraToken, camera,
    moving, hovering, mouse;

var init = function () {
    untext = {};
    allSymbolTree = null;
    allSymbols = [];
    allBars = [];
    allTokens = [];
    symbolIdSequence = 0;
    moving = null;
    hovering = null;
    mouse = [0, 0];
    keyInit();
};

var setup = function (data) {
    init();
    allSymbols = allTokens = data.tokens;
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
                barrier: config[0] === BARRIER,
                empty: config[0] === EMPTY,
                level: config[1],
            });
        }),
        symbolIdSequence: example.tokens.length,
    });
};

var example1 = {
    tokens: [['function', 1], ['addSym', 1], ['list', 2], ['symbol', 2], [BARRIER, 1], ['list', 2], ['.', 2], ['append', 2], ['symbol', 3], ['.', 3], ['createEl', 3], [EMPTY, 3]],
};

var example2 = {
    tokens: [['class', 1], ['Table', 1], ['function', 2], ['fibonaci', 2], ['n', 3], [BARRIER, 2], ['if', 3], ['n', 4], ['<', 4], ['2', 4], [BARRIER, 3], ['return', 4], ['1', 4], [BARRIER, 3], ['return', 4], ['fibonaci', 6], ['n', 7], ['-', 7], ['1', 7], ['+', 5], ['fibonaci', 6], ['n', 7], ['-', 7], ['2', 7]],
};

setupExample(example2);


//return untext;

//})();
