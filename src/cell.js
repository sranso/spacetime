'use strict';
var Cell = {};
(function () {

Cell.create = function () {
    return {
        grid: Grid.none,
        group: Group.none,
        transformation: Transformation.none,
        operation: Operation.none,
        args: [],     // [c1, r1, c2, r2, ...]
        text: '',
        gridTick: 0,
        //conditional: false,
        //disabled: false,
        base: false,
        result: null,
    };
};

Cell.coordsForArgs = function (args, cellR, cellC) {
    var coords = [];
    for (var i = 0; i < args.length; i += 2) {
        coords.push(cellR + args[i]);
        coords.push(cellC + args[i + 1]);
    }
    return coords;
};


Cell.none = Cell.create();
Cell.none.editable = false;

})();
