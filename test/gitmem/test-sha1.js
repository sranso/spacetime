var Veness = require('../../docs/sha-1/veness');
var Rusha = require('../../docs/sha-1/rusha');
var crypto = require('crypto');
var helper = require('../helper');

var stringToArray = function (string) {
    var array = new Uint8Array(string.length);
    for (var i = 0; i < string.length; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array;
};

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

var smallArray = stringToArray(smallTest);
var mediumArray = stringToArray(mediumTest);
var largeArray = stringToArray(largeTest);

var hash = new Uint8Array(20);

var rusha = new Rusha();
//var shasum;

var abc = 'abc';
var abcArray = stringToArray(abc);
Sha1.hash(abcArray, hash, 0);
log('abc', hex(hash));
//=> abc a9993e364706816aba3e25717850c26c9cd0d89d

var blah = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
var blahArray = stringToArray(blah);
Sha1.hash(blahArray, hash, 0);
log('abcdbc... blah', hex(hash));
//=> abcdbc... blah 84983e441c3bd26ebaae4aa1f95129e5e54670f1

Sha1.hash(smallArray, hash, 0);
if (hex(hash) !== 'f7140234c2c748676e0bd6470aaab773a6a4a59e') {
    console.log('wrong small digest');
    process.exit(1);
}

Sha1.hash(mediumArray, hash, 0);
if (hex(hash) !== 'ed7306fdc97d37b3376e818adff5102abfb7ad7f') {
    console.log('wrong medium digest');
    process.exit(1);
}

Sha1.hash(largeArray, hash, 0);
if (hex(hash) !== 'ef0de1c88ca010d9b73f4cd1cd49d8421f93b26a') {
    console.log('wrong large digest');
    process.exit(1);
}

// process.exit(0);

// smallTest: 288 bytes
// smallTest: 566 bytes
// largeTest: 6094 bytes

// node (native) crypto
// small: 275.000ms   / 100000      = 2.75 us   9.55 us/kB
// large: 124.976ms   /  10000      = 12.5 us   2.05 us/kB

// Veness.hash() (pre-allocating is about the same)
// small: 7468.827ms  / 100000      = 74.7 us   259  us/kB
// large: 13866.566ms /  10000      = 1387 us   228  us/kB

// new Rusha().digestFromString()
// small: 889.355ms / 100000        = 8.89 us   30.9 us/kB
// large: 992.598ms / 10000         = 99.3 us   16.3 us/kB

// new Rusha().digestFromArrayBuffer()
// small: 873.270ms / 100000        = 8.73 us   30.3 us/kB
// large: 990.999ms / 10000         = 99.1 us   16.3 us/kB

// new Rusha().digestFromArrayBuffer() without "use asm";
// small: 694.359ms / 100000        = 6.94 us   24.1 us/kB
// large: 532.112ms / 10000         = 53.2 us   8.73 us/kB

// new Rusha().rawDigest() without "use asm";
// small: 610.518ms   / 100000      = 6.11 us   21.2 us/kB
// medium: 406.437ms  /  50000      = 8.13 us   14.4 us/kB
// large: 514.857ms   /  10000      = 51.5 us   8.45 us/kB

//////////////////////////////////////////////////////////

// Sha1.hash unoptimized
// small: 3218.391ms  / 100000      = 32.2 us   112  us/kB
// large: 5926.128ms  /  10000      = 593 us    97.2 us/kB

// small: 758.706ms   / 100000      = 7.59 us   26.3 us/kB
// large: 945.151ms   /  10000      = 94.5 us   15.5 us/kB

// small: 645.849ms   / 100000      = 6.46 us   22.4 us/kB
// large: 772.093ms   /  10000      = 77.2 us   12.7 us/kB

// Sha1.hash optimized
// small: 385.685ms   / 100000      = 3.86 us   13.4 us/kB
// medium: 342.762ms  /  50000      = 6.86 us   12.1 us/kB
// large: 737.357ms   /  10000      = 73.7 us   12.1 us/kB


if (helper.runBenchmarks) {

    console.time('small');
    for (var i = 0; i < 100000; i++) {
        Sha1.hash(smallArray, hash, 0);
        //Veness.hash(smallTest);
        //rusha.digestFromString(smallTest);
        //rusha.digestFromArrayBuffer(smallArray);
        //rushaRawDigest8(smallArray, hash, 0);
        //shasum = crypto.createHash('sha1');
        //shasum.update(smallTest);
        //shasum.digest('hex');
    }
    console.timeEnd('small');

    console.time('medium');
    for (var i = 0; i < 50000; i++) {
        Sha1.hash(mediumArray, hash, 0);
        //Veness.hash(mediumTest);
        //rusha.digestFromString(mediumTest);
        //rusha.digestFromArrayBuffer(mediumArray);
        //rushaRawDigest8(mediumArray, hash, 0);
        //shasum = crypto.createHash('sha1');
        //shasum.update(mediumArray);
        //shasum.digest('hex');
    }
    console.timeEnd('medium');

    console.time('large');
    for (var i = 0; i < 10000; i++) {
        Sha1.hash(largeArray, hash, 0);
        //Veness.hash(largeTest);
        //rusha.digestFromString(largeTest);
        //rusha.digestFromArrayBuffer(largeArray);
        //rushaRawDigest8(largeArray, hash, 0);
        //shasum = crypto.createHash('sha1');
        //shasum.update(largeTest);
        //shasum.digest('hex');
    }
    console.timeEnd('large');
}
