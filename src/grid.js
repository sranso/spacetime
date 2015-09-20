'use strict';
var Grid = {};
(function () {

Grid.create = function () {
    return {
        layer: 'over',
        numFrames: 0,
        cells: [], // TODO: make this Grid.noCells,
        areas: [], // TODO: make this Grid.noAreas,
    };
};

Grid.none = Grid.create();
Grid.none.layer = 'none';
Grid.none.numFrames = 1;

Grid.noCells = [];
Grid.noAreas = [];

})();
