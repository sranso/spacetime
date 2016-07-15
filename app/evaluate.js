'use strict';
global.Evaluate = {};
(function () {

Evaluate.evaluate = function (columns, c, r) {
    var cells = getAt(columns, c);
    var cell = getAt(cells, r);
    var text = val(get(cell, Cell.text));
    if (!isNaN(+text)) {
        return text;
    }

    return '';
};

})();
