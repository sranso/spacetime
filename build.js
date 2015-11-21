#!/usr/bin/env node

var fs = require('fs');

var cheerio = require('cheerio');
var CleanCSS = require('clean-css');
var UglifyJS = require('uglify-js');

process.chdir('spacetime');

var files = fs.readdirSync('.');
var htmlFiles = files.filter(function (filename) {
    return file.indexOf('html', file.length - 4) !== -1;
});

var allSources = {};

var minifiedStyles = {};
var minifiedScripts = {};

htmlFiles.forEach(function (file) {
    var filePrefix = file.slice(0, file.length - 5);
    var html = fs.readFileSync('index.html', 'utf8');

    var $ = cheerio.load(html);

    var styles = [];
    $('link').each(function () {
        var href = $(this).attr('href');
        var type = $(this).attr('type');
        if (href && type === 'text/css') {
            styles.push(href);
            allSources[href] = true;
        }
    });
    if (styles.length) {
        var key = styles.join(';');
        var minStyle = minifiedStyles[key];
        if (!minStyle) {
            var minText = new CleanCSS().minify(styles).styles;
            minStyle = minifiedStyles[key] = htmlFile
        }
        $('link').each(function (i) {
            if (i === 0) {
                $(this).attr('href',
            var href = $(this).attr('href');
            var type = $(this).attr('type');
            if (href && type === 'text/css') {
                styles.push(href);
                allSources[href] = true;
            }
        });
    }

    var scripts = [];
    $('script').each(function () {
        var src = $(this).attr('src');
        if (!src) {
            return;
        }
        allSources[src] = true;
        if (src.indexOf('./vendor/') === -1) {
            scripts.push(src);
        }
    });
    if (scripts.length) {
        var key = scripts.join(';');
        var minified = minifiedScripts[key];
        if (!minified) {
            minified = UglifyJS.minify(scripts).code;
            minifiedScripts[key] = minified;
        }
    }
});
