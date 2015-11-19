#!/usr/bin/env node

//
// ATTENTION: add new versions to the bottom!
//

var versions = [];
var versionsTable = {};

var currentVersionNumbers = [-1, 9, 99, 999];
var startingVersionNumbers = [0, 10, 100, 1000];

var stabilityPrefix = ['', '0', '00', '000'];

var helpText = [
    'Usage: node versions.js <command>',
    '',
    'Commands:',
    '    v014       info for given version',
    '    json       json dump of everything',
    '    list       version numbers in order',
    '    current    the current versions',
    '    next       the next versions',
    '    next v0xx  the next v0xx version (e.g. v023)',
    '    help       help text',
].join('\n');

var main = function () {
    processRawVersions();
    if (process.argv.length === 1) {
        var command = 'current';
    } else if (process.argv.length === 2) {
        var command = 'help';
    } else {
        var command = process.argv[2];
    }

    if (command === 'help') {
        console.log(helpText);
    } else if (command === 'json') {
        console.log(JSON.stringify(versions, null, 4));
    } else if (command === 'current') {
        versionInfo(toVersion);
    } else if (command === 'next') {
        versionInfo(toNextVersion);
    } else if (command === 'list') {
        versions.forEach(function (v) { console.log(v.version) });
    } else {
        var v = versionsTable[command];
        if (v) {
            console.log(JSON.stringify(v, null, 4));
        } else {
            console.log('version ' + command + ' not found');
            console.log(helpText);
        }
    }
};

var processRawVersions = function () {
    for (var i = 0; i < rawVersions.length; i += 2) {
        var version = rawVersions[i];
        var rawAttributes = rawVersions[i + 1];
        var attributes = {
            version: version,
        };
        for (key in rawAttributes) {
            attributes[key] = rawAttributes[key];
        }

        var track = trackFor(version);
        var number = +version.slice(track + 1);
        var currentNumber = currentVersionNumbers[track];
        var nextNumber = currentNumber + 1;
        var nextVersion = toVersion(nextNumber, track);

        if (number < nextNumber) {
            console.log('version ' + version + ' is below expected ' + nextVersion);
            process.exit(1);
        } else if (number > nextNumber) {
            console.log('version ' + version + ' is above expected ' + nextVersion);
            process.exit(1);
        }

        versions.push(attributes);
        versionsTable[version] = attributes;
        currentVersionNumbers[track] = number;
    };
};

var versionInfo = function (toVersionMethod) {
    if (process.argv.length === 4) {
        var track = trackFor(process.argv[3]);
        var number = currentVersionNumbers[track];
        console.log(toVersionMethod(number, track));
    } else {
        console.log(currentVersionNumbers.map(toVersionMethod).join('\n'));
    }
};

var trackFor = function (version) {
    if (version.indexOf('v000') === 0) {
        return 3;
    } else if (version.indexOf('v00') === 0) {
        return 2;
    } else if (version.indexOf('v0') === 0 && version !== 'v0') {
        return 1;
    } else {
        return 0;
    }
};

var toVersion = function (number, track) {
    return 'v' + stabilityPrefix[track] + number;
};

var toNextVersion = function (number, track) {
    return toVersion(number + 1, track);
};


var rawVersions = [
//////////////////////////////////////////////////////////////////////
//vvvvvv Edit at the bottom (chronological order) vvvvvvvvvvvvvvvvvvvv

//^^^^^^ EDIT ABOVE THIS LINE ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//////////////////////////////////////////////////////////////////////
];
main();
