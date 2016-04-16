#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var async = require('async');
var cheerio = require('cheerio');
var CleanCSS = require('clean-css');
var UglifyJS = require('uglify-js');

var buildAll = function (buildCallback) {
    async.series([
        async.apply(fs.mkdir, 'dist'),
        async.apply(fs.mkdir, 'dist/vendor'),
        function (callback) {
            fs.readdir('spacetime/app/vendor', function (err, vendorFiles) {
                if (err) throw err;
                async.eachLimit(vendorFiles, 8, buildVendor, callback);
            });
        },
        buildAllHtml
    ], buildCallback);
};

var minifiedStyleShas = {};
var minifiedScriptShas = {};
var minifiedVendors = {};

var buildVendor = function (vendor, callback) {
    minifyScripts(['spacetime/app/vendor/' + vendor], function (err, result) {
        if (err) throw err;
        var vendorPrefix = vendor.slice(0, vendor.length - 3);
        var name = 'vendor/' + vendorPrefix + '-' + result.sha + '.js';
        minifiedVendors['./app/vendor/' + vendor] = name;
        fs.writeFile('dist/' + name, result.text, 'utf8', callback);
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
    var minified = new CleanCSS().minify(styles);
    if (minified.errors.length) {
        return callback(new Error(minified.errors.join('; ')));
    }

    var text = minified.styles;
    sha = crypto.createHash('sha1').update(text).digest('hex');
    minifiedStyleShas[key] = sha;
    callback(null, {text: text, sha: sha});
};

var ignoreDirectories = [
    'spacetime/.git',
    'spacetime/LICENSES',
    'spacetime/dev',
    'spacetime/log',
    'spacetime/node_modules',
    'spacetime/app',
    'spacetime/test',
];

var buildAllHtml = function (buildCallback) {
    findAllHtml('spacetime', [], function (err, htmlFiles) {
        if (err) throw err;
        async.eachLimit(htmlFiles, 3, buildHtmlFile, buildCallback);
    });
};

// http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
var findAllHtml = function (dir, htmlFiles, findCallback) {
    fs.readdir(dir, function (err, files) {
        if (err) throw err;
        files = files.map(function (file) {
            return path.join(dir, file);
        });
        var newHtmlFiles = files.filter(function (file) {
            return file.indexOf('.html', file.length - 5) !== -1;
        });
        htmlFiles.push.apply(htmlFiles, newHtmlFiles);
        var possibleDirectories = files.filter(function (file) {
            return (
                newHtmlFiles.indexOf(file) === -1 &&
                ignoreDirectories.indexOf(file) === -1
            );
        });
        async.eachLimit(possibleDirectories, 4, function (file, callback) {
            fs.lstat(file, function (err, stat) {
                if (err) return callback(err);
                if (stat.isDirectory()) {
                    findAllHtml(file, htmlFiles, callback);
                } else {
                    callback(null);
                }
            });
        }, function (err) {
            if (err) throw err;
            findCallback(null, htmlFiles);
        });
    });
};

var buildHtmlFile = function (htmlFile, htmlCallback) {
    async.waterfall([
        async.apply(maybeMakeHtmlDir, htmlFile),
        async.apply(fs.readFile, htmlFile, 'utf8'),
        async.apply(buildHtml, htmlFile),
    ], htmlCallback);
};

var htmlDirs = {'spacetime': true};

var maybeMakeHtmlDir = function (htmlFile, callback) {
    var dir = path.dirname(htmlFile);
    if (htmlDirs[dir]) return callback(null);

    maybeMakeHtmlDir(dir, function (err) {
        if (err) throw err;
        if (htmlDirs[dir]) return callback(null);
        htmlDirs[dir] = true;
        fs.mkdir('dist/' + path.relative('spacetime', dir), callback);
    });
};

var buildHtml = function (htmlFile, html, htmlCallback) {
    var dir = path.dirname(htmlFile);
    var $ = cheerio.load(html);

    var styles = [];
    $('link').each(function () {
        var href = $(this).attr('href');
        var type = $(this).attr('type');
        if (href && type === 'text/css') {
            styles.push(path.join(dir, href));
        }
    });

    var scripts = [];
    $('script').each(function () {
        var src = $(this).attr('src');
        if (src && src.indexOf('./app/') === 0) {
            scripts.push(path.join(dir, src));
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
        if (err) throw err;

        var saveFiles = [];

        if (result.styles) {
            var name = 'styles-' + result.styles.sha + '.css';
            var first = true;
            $('link').each(function () {
                if ($(this).attr('type') === 'text/css') {
                    if (first) {
                        $(this).attr('href', '/' + name);
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
                if (src.indexOf('./app/vendor/') === 0) {
                    $(this).attr('src', '/' + minifiedVendors[src]);
                } else if (first) {
                    $(this).attr('src', '/' + name);
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
            name: path.relative('spacetime', htmlFile),
        });
        async.each(saveFiles, function (file, callback) {
            fs.writeFile('dist/' + file.name, file.text, 'utf8', callback);
        }, htmlCallback);
    });
};

buildAll(function (err) {
    if (err) throw err;
});
