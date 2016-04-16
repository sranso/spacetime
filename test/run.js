#!/usr/bin/env node
var path = require('path');
var exec = require('child_process').exec;

var helper = require('./helper');
helper.logToTerminal = false;

var paths = [
    path.join(__dirname, '../app/test'),
    path.join(__dirname, '../gitmem/test'),
].join(' ');

exec('find ' + paths + ' -type f -name "test-*"', function (err, stdout) {
    var files = stdout.replace(/\n$/, '').split('\n');
    files.forEach(function (file) {
        var shortName = file.split('/').pop();
        if ([
            //'test-gitmem.js',
        ].indexOf(shortName) === -1) {
            require(file);
        }
    });
});
