window.untext = (function () {

var untext, alphabet, string, $alphabet, $string, $overflow;

var init = function () {
    untext = {};
    alphabet = [];
    string = [];
    $alphabet = $('#the-alphabet');
    $string = $('#the-string');
    $overflow = $('#the-overflow');
};


//////

var Symbol = function (text) {
    this.text = text;
};

Symbol.prototype.createEl = function () {
    this.$el = $('<span class="symbol">' + this.text + '</span>');
    return this.$el;
};


//////

var addSymbolToList = function ($list, symbol) {
    $list.append(symbol.createEl());
};


//////

var setup = function (data) {
    init();

    var createLists = function ($list, symbols) {
        _.each(symbols, function (s) { addSymbolToList($list, s) });
    };
    createLists($alphabet, data.alphabet);
    createLists($string, data.string);
    createLists($overflow, data.overflow);

    console.log('untext loaded');
};

var setupExample = function (example) {
    var newSym = function (s) { return new Symbol(s) }
    var data = {
        alphabet: _.map(example.alphabet, newSym),
        string: _.map(example.string, newSym),
        overflow: _.map(example.overflow, newSym),
    }, newSym;
    setup(data);
};

setupExample({
    alphabet: ['x', 'y', 'z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', "'", 'All', 'Exists', ':', '(', ')', '=', 'S', '0', '+'],
    string: ['All', 'x', 'Exists', 'y', ':', 'S', 'x', '+', 'S', '0', '=', '(', 'y', '+', 'S', '0', ')', '+', 'S', '0'],
    overflow: [''],
});

return untext;

})();
