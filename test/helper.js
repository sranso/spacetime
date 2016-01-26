var fs = require('fs');
var path = require('path');
var util = require('util');

var loader = require('./loader');

var html = fs.readFileSync(path.resolve(__dirname, '../new.html'), 'utf-8');
loader.loadNode(html);

var allFileLines = {};

exports.logToTerminal = true;
exports.runBenchmarks = true;

global.log = function () {
    try {
        throw new Error('intentional error');
    } catch (e) {
        var stackLine = e.stack.split('\n', 4)[2];
    }
    var match = / \(([^(]+):(\d+):(\d+)\)$/.exec(stackLine);
    if (!match) {
        throw new Error('Could not find source of `log` call');
    }
    var file = match[1];
    var line = +match[2] - 1;
    var character = +match[3] - 1;
    if (!allFileLines[file]) {
        allFileLines[file] = {
            lines: fs.readFileSync(file, 'utf-8').split('\n'),
            changed: false,
            numberDifference: 0,
        }
        allFileLines[file].changed = false;
    }
    var fileLineInfo = allFileLines[file];
    var fileLines = fileLineInfo.lines;

    var outputLines = util.format.apply(util, arguments).split('\n');
    outputLines = outputLines.map(function (line) {
        var indent = '                                        '.slice(0, character);
        if (line.length) {
            return indent + '//=> ' + line;
        } else {
            return indent + '//=>';
        }
    });

    var j = line + fileLineInfo.numberDifference;
    var logLine = fileLines[j];
    j += 1;

    var i;
    for (i = 0; i < outputLines.length; i++) {
        var fileLine = fileLines[j + i];
        var outLine = outputLines[i];
        var isLog = fileLine.slice(character, character + 4) === '//=>';
        if (outLine !== fileLine) {
            fileLineInfo.changed = true;
            if (isLog) {
                fileLines[j + i] = outLine;
            } else {
                fileLines.splice(j + i, 0, outLine);
                fileLineInfo.numberDifference++;
            }
        }
    }

    i += j;
    while (i < fileLines.length) {
        var fileLine = fileLines[i];
        if (fileLine.slice(character, character + 4) === '//=>') {
            fileLines.splice(i, 1);
            fileLineInfo.changed = true;
            fileLineInfo.numberDifference--;
        } else {
            break;
        }
    }

    if (exports.logToTerminal) {
        console.log(logLine);
        console.log(outputLines.join('\n'));
    }
};

process.on('exit', function () {
    for (var file in allFileLines) {
        var fileLineInfo = allFileLines[file];
        if (fileLineInfo.changed) {
            fs.writeFileSync(file, fileLineInfo.lines.join('\n'), 'utf-8');
        }
    }
});
