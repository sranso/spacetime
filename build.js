#!/usr/bin/env node

var fs = require('fs');
var crypto = require('crypto');

var async = require('async');
var cheerio = require('cheerio');
var CleanCSS = require('clean-css');
var UglifyJS = require('uglify-js');

var main = function () {
    async.series([
        cleanDist,
        buildAll,
    ], function (err, results) {
        if (err) throw err;
    });
};

var cleanDist = function (distCallback) {
    async.parallel([
        function (callback) {
            fs.readdir('dist/vendor', function (err, files) {
                if (err) return callback(err);
                files = files.map(function (file) {
                    return 'dist/vendor/' + file;
                });
                async.eachLimit(files, 8, fs.unlink, callback);
            });
        },
        function (callback) {
            fs.readdir('dist', function (err, files) {
                if (err) return callback(err);
                files.splice(files.indexOf('vendor'), 1);
                files = files.map(function (file) {
                    return 'dist/' + file;
                });
                async.eachLimit(files, 8, fs.unlink, callback);
            });
        },
    ], distCallback);
};

var buildAll = function (buildCallback) {
    process.chdir('spacetime');

    async.waterfall([
        async.apply(fs.readdir, 'vendor'),
        function (vendorFiles, callback) {
            async.eachLimit(vendorFiles, 8, buildVendor, callback);
        },
        async.apply(fs.readdir, '.'),
        function (files, callback) {
            var htmlFiles = files.filter(function (file) {
                return file.indexOf('html', file.length - 4) !== -1;
            });
            async.eachLimit(htmlFiles, 3, buildHtmlFile, callback);
        }
    ], buildCallback);
};

var minifiedStyleShas = {};
var minifiedScriptShas = {};
var minifiedVendors = {};

var buildVendor = function (vendor, callback) {
    minifyScripts(['vendor/' + vendor], function (err, result) {
        if (err) return callback(err);
        var vendorPrefix = vendor.slice(0, vendor.length - 3);
        var name = 'vendor/' + vendorPrefix + '-' + result.sha + '.js';
        minifiedVendors['./vendor/' + vendor] = name;
        fs.writeFile('../dist/' + name, result.text, 'utf8', callback);
    });
};

// See uglify-save-license (https://github.com/shinnn/uglify-save-license)
var keepLicense = function (state, node, comment) {
    if (comment.file !== state.previousFile) {
        state.previousLine = 0;
    }
    state.previousFile = comment.file;

    if (comment.line === state.previousLine + 1) {
        state.previousLine = comment.line;
        return true;
    }
};

var minifyScripts = function (scripts, callback) {
    var key = scripts.join(';');
    var sha = minifiedScriptShas[key];
    if (sha) {
        return callback(null, {text: null, sha: sha});
    }
    var options = {
        output: {
            comments: async.apply(keepLicense, {}),
        }
    };
    var text = UglifyJS.minify(scripts, options).code;
    sha = crypto.createHash('sha1').update(text).digest('hex');
    minifiedScriptShas[key] = sha;
    callback(null, {text: text, sha: sha});
};

var minifyStyles = function (styles, callback) {
    var key = styles.join(';');
    var sha = minifiedStyleShas[key];
    if (sha) {
        return callback(null, {text: null, sha: sha});
    }
    var text = new CleanCSS().minify(styles).styles;
    sha = crypto.createHash('sha1').update(text).digest('hex');
    minifiedStyleShas[key] = sha;
    callback(null, {text: text, sha: sha});
};

var buildHtmlFile = function (file, htmlCallback) {
    async.waterfall([
        async.apply(fs.readFile, file, 'utf8'),
        async.apply(buildHtml, file),
    ], htmlCallback);
};

var buildHtml = function (htmlFile, html, htmlCallback) {
    var $ = cheerio.load(html);

    var styles = [];
    $('link').each(function () {
        var href = $(this).attr('href');
        var type = $(this).attr('type');
        if (href && type === 'text/css') {
            styles.push(href);
        }
    });

    var scripts = [];
    $('script').each(function () {
        var src = $(this).attr('src');
        if (src && src.indexOf('./vendor/') === -1) {
            scripts.push(src);
        }
    });

    async.parallel({
        styles: function (callback) {
            if (!styles.length) return callback(null, null);
            minifyStyles(styles, callback);
        },
        scripts: function (callback) {
            if (!scripts.length) return callback(null, null);
            minifyScripts(scripts, callback);
        },
    }, function (err, result) {
        if (err) return htmlCallback(err);

        var saveFiles = [];

        if (result.styles) {
            var name = 'styles-' + result.styles.sha + '.css';
            var first = true;
            $('link').each(function () {
                if ($(this).attr('type') === 'text/css') {
                    if (first) {
                        $(this).attr('href', './' + name);
                        first = false;
                    } else {
                        $(this).remove();
                    }
                }
            });
            if (result.styles.text) {
                saveFiles.push({text: result.styles.text, name: name});
            }
        }

        if (result.scripts) {
            var name = 'scripts-' + result.scripts.sha + '.js';
            var first = true;
            $('script').each(function () {
                var src = $(this).attr('src');
                if (!src) {
                    return;
                }
                if (src.indexOf('./vendor/') === 0) {
                    $(this).attr('src', './' + minifiedVendors[src]);
                } else if (first) {
                    $(this).attr('src', './' + name);
                    first = false;
                } else {
                    $(this).remove();
                }
            });
            if (result.scripts.text) {
                saveFiles.push({text: result.scripts.text, name: name});
            }
        }

        saveFiles.push({
            text: $.html(),
            name: htmlFile,
        });
        async.each(saveFiles, function (file, callback) {
            fs.writeFile('../dist/' + file.name, file.text, 'utf8', callback);
        }, htmlCallback);
    });
};

main();
