'use strict';
global.Grid = {};
(function () {

// Cell contains `columns`, rather than Grid, as it makes
// the tree less deep:
//    project.cell.columns[1][2].columns[3][4]    vs.
//    project.cell.grid.columns[1][2].grid.columns[3][4]
// Grid.continueCell = ?
// Grid.repeatFrom   = ?
// Grid.input        = ?

})();
