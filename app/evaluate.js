'use strict';
global.Evaluate = {};
(function () {

Evaluate.evaluate = function (columns, c, r) {
    var cells = getAt(columns, c);
    var cell = getAt(cells, r);
    var text = val(get(cell, Cell.text));
    if (!isNaN(+text)) {
        return +text;
    }

    var args = get(cell, Cell.args);
    var lenArgs = len(args);

    var argResults = [];
    var i;
    for (i = 0; i < lenArgs; i++) {
        var arg = getAt(args, i);
        var argC = c + val(get(arg, Cell.Arg.cDiff));
        var argR = r + val(get(arg, Cell.Arg.rDiff));
        argResults[i] = Evaluate.evaluate(columns, argC, argR);
    }

    switch (text) {
    case '+':
        return argResults[0] + argResults[1];
    case '-':
        return argResults[0] - argResults[1];
    case '*':
        return argResults[0] * argResults[1];
    case '/':
        return argResults[0] / argResults[1];
    }

    return '';
};

})();
