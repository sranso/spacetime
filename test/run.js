#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var helper = require('./helper');
helper.logToTerminal = false;

exec('find ' + __dirname + ' -type f | grep "/test-.*\\.js$"', function (err, stdout) {
    var files = stdout.replace(/\n$/, '').split('\n');
    files.forEach(function (file) {
        //if (file.split('/').pop() !== 'test-random.js') {
        require(file);
        //}
    });
});
