'use strict';
var Veness = require('../../docs/sha-1/veness');
var Rusha = require('../../docs/sha-1/rusha');
var crypto = require('crypto');
require('../../test/helper');

// tinyTest: 20 bytes  (once tested at 55 bytes = max 1 block)
// maxTreeTest: 151 bytes
// smallTest: 288 bytes
// mediumTest: 566 bytes
// largeTest: 6094 bytes

// node (native) crypto
// tiny: 998.099ms    / 500000      =  2.0  us     100.  ns/B
// small: 253.933ms   / 100000      =  2.5  us       8.8 ns/B
// medium: 165.308ms  /  50000      =  3.3  us       5.8 ns/B
// large: 119.074ms   /  10000      = 12.   us       2.0 ns/B

// Veness.hash() (pre-allocating is about the same)
// small: 7468.827ms  / 100000    =   74.7  us     260.  ns/B
// large: 13866.566ms /  10000    = 1387.   us     230.  ns/B

// new Rusha().rawDigest() without "use asm"; (faster without)
// tiny: 2034.044ms   / 500000      =  4.1  us     203.  ns/B
// small: 602.909ms   / 100000      =  6.0  us      21.  ns/B
// medium: 396.352ms  /  50000      =  7.9  us      14.  ns/B
// large: 513.349ms   /  10000      = 51.   us       8.4 ns/B

// Sha1.hash optimized (timed at the same time as node and rusha)
// tiny: 395.984ms    / 500000      =  0.79 us      40.  ns/B
// tiny (55 B = most for 1 block):
//       404.699ms    / 500000      =  0.81 us      15.  ns/B
// small: 391.985ms   / 100000      =  3.9  us      14.  ns/B
// medium: 350.995ms  /  50000      =  7.0  us      12.  ns/B
// large: 729.027ms   /  10000      = 73.   us      12.  ns/B

// Sha1.hash with max tree. Added later when small was
// taking 354 ms (at 90% of the time).
// max tree: 432.719ms / 200000     =  2.2  us      12.  ns/B


var tinyTest = 'blob 12\0foo_function';

var maxTreeTest =
'tree 142\x00100644 property\x00\xDB\xA1>\xD2\xDD\xF7\x83\xEE\x81\x18\xC6\xA5\x81\xDB\xF7S\x05\xF8\x16\xA340000 detached\x00\xD9\xFAQ\x82\xE2\x01\xCF\xED*\x99\xBA*\xC3\xC1\xE4\xD6O\x04\b\xCB100644 arguments\x00]z\xE5\xF2S\xED\xF1^\x0E\x8F\xB3\xB5\x90Q\x8Au\xC7\x15\x96{40000 results\x00\xF3\x0FG.N\xB19\xD7\xC4&\x84\x83^\x87\xBC\xB7\xD4\x11\x27s';

console.log(maxTreeTest.length);

// contents of git tree
var smallTest =
'tree 279\x00100644 LICENSE.txt\x00\xDB\xA1>\xD2\xDD\xF7\x83\xEE\x81\x18\xC6\xA5\x81\xDB\xF7S\x05\xF8\x16\xA340000 LICENSES\x00\xD9\xFAQ\x82\xE2\x01\xCF\xED*\x99\xBA*\xC3\xC1\xE4\xD6O\x04\b\xCB100644 README.md\x00]z\xE5\xF2S\xED\xF1^\x0E\x8F\xB3\xB5\x90Q\x8Au\xC7\x15\x96{40000 blog\x00\xF3\x0FG.N\xB19\xD7\xC4&\x84\x83^\x87\xBC\xB7\xD4\x11\x27s100644 index.html\x00\xB9\x9D\t|\xC9\xACj_\xE9k\xC85EZ\xF6h\xBD\x00Q\xF7100644 new.html\x00u\xA4\xB7\xE5g\xEF\xAEG\x7F\xBF\xFB\xB2\x8F}\xD1\x151\xAB\x1D\xE040000 src\x00\xFF\xEA\xB3\xA2\xA3\b\xDEYw[\xF65\x97V\xC2\xEC\xA3Z.\xC540000 vendor\x00\xDE\xB4\xEDQ\xFE\xF5\x98\xA5@\xAD\xD8\xF1\x05zi`b\xD64b';

var mediumTest =
'tree 279\x00100644 LICENSE.txt\x00\xDB\xA1>\xD2\xDD\xF7\x83\xEE\x81\x18\xC6\xA5\x81\xDB\xF7S\x05\xF8\x16\xA340000 LICENSES\x00\xD9\xFAQ\x82\xE2\x01\xCF\xED*\x99\xBA*\xC3\xC1\xE4\xD6O\x04\b\xCB100644 README.md\x00]z\xE5\xF2S\xED\xF1^\x0E\x8F\xB3\xB5\x90Q\x8Au\xC7\x15\x96{40000 blog\x00\xF3\x0FG.N\xB19\xD7\xC4&\x84\x83^\x87\xBC\xB7\xD4\x11\x27s100644 index.html\x00\xB9\x9D\t|\xC9\xACj_\xE9k\xC85EZ\xF6h\xBD\x00Q\xF7100644 new.html\x00u\xA4\xB7\xE5g\xEF\xAEG\x7F\xBF\xFB\xB2\x8F}\xD1\x151\xAB\x1D\xE040000 src\x00\xFF\xEA\xB3\xA2\xA3\b\xDEYw[\xF65\x97V\xC2\xEC\xA3Z.\xC540000 vendor\x00\xDE\xB4\xEDQ\xFE\xF5\x98\xA5@\xAD\xD8\xF1\x05zi`b\xD64100644 LICENSE.txt\x00\xDB\xA1>\xD2\xDD\xF7\x83\xEE\x81\x18\xC6\xA5\x81\xDB\xF7S\x05\xF8\x16\xA340000 LICENSES\x00\xD9\xFAQ\x82\xE2\x01\xCF\xED*\x99\xBA*\xC3\xC1\xE4\xD6O\x04\b\xCB100644 README.md\x00]z\xE5\xF2S\xED\xF1^\x0E\x8F\xB3\xB5\x90Q\x8Au\xC7\x15\x96{40000 blog\x00\xF3\x0FG.N\xB19\xD7\xC4&\x84\x83^\x87\xBC\xB7\xD4\x11\x27s100644 index.html\x00\xB9\x9D\t|\xC9\xACj_\xE9k\xC85EZ\xF6h\xBD\x00Q\xF7100644 new.html\x00u\xA4\xB7\xE5g\xEF\xAEG\x7F\xBF\xFB\xB2\x8F}\xD1\x151\xAB\x1D\xE040000 src\x00\xFF\xEA\xB3\xA2\xA3\b\xDEYw[\xF65\x97V\xC2\xEC\xA3Z.\xC540000 vendor\x00\xDE\xB4\xEDQ\xFE\xF5\x98\xA5@\xAD\xD8\xF1\x05zi`b\xD64b';

var largeTest =
'var Execute = {};\n' +
'(function () {\n' +
'\n' +
'Execute.transform = function () {\n' +
'    __stats.transform_time = performance.now();\n' +
'    __stats.transform_numCells = 0;\n' +
'\n' +
'    var level = Project.currentLevel($Project);\n' +
'    var currentCell = level.cell;\n' +
'    if (Global.forceCaptureInput || Global.framesToAdvance > 0) {\n' +
'        Global.capturedInput = Input.clone(Global.currentInput);\n' +
'        while (true) {\n' +
'            $Project.transformationTick += 1;\n' +
'            if (Global.framesToAdvance > 0) {\n' +
'                $Project.currentFrame++;\n' +
'            }\n' +
'            Execute.transformCell(currentCell, $Project.currentFrame, level.grid, level.c, level.r);\n' +
'            if (Global.framesToAdvance > 0) {\n' +
'                Global.framesToAdvance--;\n' +
'                var numFrames = Cell.numFrames(currentCell);\n' +
'                if ($Project.currentFrame >= numFrames - 1) {\n' +
'                    Global.play = false;\n' +
'                    break;\n' +
'                }\n' +
'            }\n' +
'            if (Global.framesToAdvance === 0) {\n' +
'                break;\n' +
'            }\n' +
'        }\n' +
'    } else {\n' +
'        $Project.transformationTick += 1;\n' +
'    }\n' +
'\n' +
'    var grid = $Project.cellLevels[0].grid;\n' +
'    for (var i = 0; i < $Project.cellLevels.length; i++) {\n' +
'        var level = $Project.cellLevels[i];\n' +
'        var column = grid.cells[level.c];\n' +
'        var cell = column && column[level.r];\n' +
'        if (!cell) {\n' +
'            $Project.cellLevels.splice(i, $Project.cellLevels.length - i);\n' +
'            break;\n' +
'        }\n' +
'        Execute.transformGrid(grid, -1);\n' +
'        level.cell = cell;\n' +
'        level.grid = grid;\n' +
'        grid = cell.grid;\n' +
'    }\n' +
'\n' +
'    var numFrames = Cell.numFrames(currentCell);\n' +
'    if ($Project.currentFrame >= numFrames) {\n' +
'        $Project.currentFrame = numFrames - 1;\n' +
'    }\n' +
'\n' +
'    __stats.transform_time = performance.now() - __stats.transform_time;\n' +
'};\n' +
'\n' +
'Execute.transformGrid = function (grid, currentFrame) {\n' +
'    grid.numFrames = 0;\n' +
'\n' +
'    for (var c = 0; c < grid.cells.length; c++) {\n' +
'        var cell;\n' +
'        for (var r = 0; r < grid.cells[0].length; r++) {\n' +
'            cell = grid.cells[c][r];\n' +
'            Execute.transformCell(cell, currentFrame, grid, c, r);\n' +
'        }\n' +
'        var numFrames = Cell.numFrames(cell);\n' +
'        grid.numFrames += numFrames;\n' +
'        currentFrame -= numFrames;\n' +
'    }\n' +
'};\n' +
'\n' +
'Execute.transformCell = function (cell, currentFrame, grid, c, r) {\n' +
'    if (cell.transformationTick === $Project.transformationTick) {\n' +
'        return;\n' +
'    }\n' +
'    cell.transformationTick = $Project.transformationTick;\n' +
'    __stats.transform_numCells += 1;\n' +
'\n' +
'    if (cell.detached) {\n' +
'        var transformation = Transformation.empty;\n' +
'    } else {\n' +
'        var transformation = cell.transformation;\n' +
'    }\n' +
'    transformation.transform(cell, currentFrame, grid, c, r);\n' +
'};\n' +
'\n' +
'Execute.executeGrid = function (grid) {\n' +
'    __stats.execGrid_time = performance.now();\n' +
'    var oldStats = __stats;\n' +
'    var capturedStats = {\n' +
'        execCell_numCells: 0,\n' +
'        execCell_numBaseCells: 0,\n' +
'    };\n' +
'    __stats = capturedStats;\n' +
'\n' +
'    $Project.executionTick += 1;\n' +
'\n' +
'    for (var c = 0; c < grid.cells.length; c++) {\n' +
'        for (var r = 0; r < grid.cells[0].length; r++) {\n' +
'            var cell = grid.cells[c][r];\n' +
'            executeCell(cell, 0, grid, c, r);\n' +
'        }\n' +
'    }\n' +
'\n' +
'    __stats = oldStats;\n' +
'    __stats.execGrid_numCells = capturedStats.execCell_numCells;\n' +
'    __stats.execGrid_numBaseCells = capturedStats.execCell_numBaseCells;\n' +
'    __stats.execGrid_time = performance.now() - __stats.execGrid_time;\n' +
'};\n' +
'\n' +
'Execute.executeColumn = function (grid, c, fetchFrame) {\n' +
'    $Project.executionTick += 1;\n' +
'\n' +
'    for (var r = 0; r < grid.cells[0].length; r++) {\n' +
'        var cell = grid.cells[c][r];\n' +
'        executeCell(cell, fetchFrame, grid, c, r);\n' +
'    }\n' +
'};\n' +
'\n' +
'Execute.executeCell = function (cell, fetchFrame, grid, c, r) {\n' +
'    __stats.execCell_time = performance.now();\n' +
'    __stats.execCell_numCells = 0;\n' +
'    __stats.execCell_numBaseCells = 0;\n' +
'\n' +
'    $Project.executionTick += 1;\n' +
'    executeCell(cell, fetchFrame, grid, c, r);\n' +
'\n' +
'    __stats.execCell_time = performance.now() - __stats.execCell_time;\n' +
'};\n' +
'\n' +
'var executeCell = function (cell, fetchFrame, pGrid, pC, pR) {\n' +
'    __stats.execCell_numCells += 1;\n' +
'\n' +
'    var endFrame = Cell.endFrame(cell);\n' +
'    fetchFrame += cell.startFrame;\n' +
'    if (fetchFrame > endFrame) {\n' +
'        cell.result = Result.empty;\n' +
'        return cell.result;\n' +
'    }\n' +
'    if (cell.loopFrames) {\n' +
'        fetchFrame = fetchFrame % cell.grid.numFrames;\n' +
'    } else if (fetchFrame >= cell.grid.numFrames) {\n' +
'        cell.result = Result.empty;\n' +
'        return cell.result;\n' +
'    }\n' +
'    if (cell.operation !== Operation.none) {\n' +
'        executeBaseCell(cell, pGrid, pC, pR);\n' +
'        return cell.result;\n' +
'    }\n' +
'\n' +
'    var atFrame = 0;\n' +
'    var r = cell.grid.cells[0].length - 1;\n' +
'\n' +
'    for (var c = 0; c < cell.grid.cells.length; c++) {\n' +
'        var subCell = cell.grid.cells[c][r];\n' +
'        var subEnd = atFrame + Cell.numFrames(subCell) - 1;\n' +
'\n' +
'        if (atFrame <= fetchFrame && fetchFrame <= subEnd) {\n' +
'            cell.result = executeCell(subCell, fetchFrame - atFrame, cell.grid, c, r);\n' +
'            return cell.result;\n' +
'        }\n' +
'        atFrame = subEnd + 1;\n' +
'    }\n' +
'\n' +
'    throw new Error("Could not find frame " + fetchFrame + " / " + cell.grid.numFrames);\n' +
'};\n' +
'\n' +
'var executeBaseCell = function (cell, grid, c, r) {\n' +
'    if (cell.executionTick === $Project.executionTick) {\n' +
'        return;\n' +
'    }\n' +
'    cell.executionTick = $Project.executionTick;\n' +
'    __stats.execCell_numCells += 1;\n' +
'    __stats.execCell_numBaseCells += 1;\n' +
'\n' +
'    var argCells = [cell];\n' +
'    for (var i = 0; i < cell.args.length; i += 2) {\n' +
'        var argC = c + cell.args[i];\n' +
'        var argR = r + cell.args[i + 1];\n' +
'        var argCell = grid.cells[argC][argR];\n' +
'        argCells.push(argCell);\n' +
'        executeCell(argCell, 0, grid, argC, argR);\n' +
'    }\n' +
'    cell.result = cell.operation.execute.apply(cell.operation, argCells);\n' +
'};\n' +
'\n' +
'Execute.executeArg = function (cell, fetchFrame, argIndex, grid, c, r) {\n' +
'    var argC = c + cell.args[argIndex];\n' +
'    var argR = r + cell.args[argIndex + 1];\n' +
'    var argCell = grid.cells[argC][argR];\n' +
'    Execute.executeCell(argCell, fetchFrame, grid, argC, argR);\n' +
'};\n' +
'\n' +
'})();\n';

var rushaRawDigest8 = function (M, H, H_offset) {
    var H32 = rusha.rawDigest(M);
    var H8 = new Uint8Array(H32.buffer);
    for (var i = 0; i < 20; i++) {
        H[H_offset = i] = H8[i];
    }
};

var tinyArray = Convert.stringToArray(tinyTest);
var maxTreeArray = Convert.stringToArray(maxTreeTest);
var smallArray = Convert.stringToArray(smallTest);
var mediumArray = Convert.stringToArray(mediumTest);
var largeArray = Convert.stringToArray(largeTest);

var i;
var shasum;
var rusha = new Rusha();
var hashArray = new Uint8Array(20);

console.time('tiny');
for (i = 0; i < 500000; i++) {
    Sha1.hash(tinyArray, 0, tinyArray.length, hashArray, 0);
    //Veness.hash(tinyTest);
    //rushaRawDigest8(tinyArray, hash, 0);
    //shasum = crypto.createHash('sha1');
    //shasum.update(tinyArray);
    //shasum.digest('hex');
}
console.timeEnd('tiny');

console.time('max tree');
for (i = 0; i < 200000; i++) {
    Sha1.hash(maxTreeArray, 0, maxTreeArray.length, hashArray, 0);
    //Veness.hash(maxTreeTest);
    //rushaRawDigest8(maxTreeArray, hash, 0);
    //shasum = crypto.createHash('sha1');
    //shasum.update(maxTreeArray);
    //shasum.digest('hex');
}
console.timeEnd('max tree');


console.time('small');
for (i = 0; i < 100000; i++) {
    Sha1.hash(smallArray, 0, smallArray.length, hashArray, 0);
    //Veness.hash(smallTest);
    //rushaRawDigest8(smallArray, hash, 0);
    //shasum = crypto.createHash('sha1');
    //shasum.update(smallArray);
    //shasum.digest('hex');
}
console.timeEnd('small');

console.time('medium');
for (i = 0; i < 50000; i++) {
    Sha1.hash(mediumArray, 0, mediumArray.length, hashArray, 0);
    //Veness.hash(mediumTest);
    //rushaRawDigest8(mediumArray, hash, 0);
    //shasum = crypto.createHash('sha1');
    //shasum.update(mediumArray);
    //shasum.digest('hex');
}
console.timeEnd('medium');

console.time('large');
for (i = 0; i < 10000; i++) {
    Sha1.hash(largeArray, 0, largeArray.length, hashArray, 0);
    //Veness.hash(largeTest);
    //rushaRawDigest8(largeArray, hash, 0);
    //shasum = crypto.createHash('sha1');
    //shasum.update(largeArray);
    //shasum.digest('hex');
}
console.timeEnd('large');
