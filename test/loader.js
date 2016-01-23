'use strict';
var Loader = typeof exports === 'object' ? exports : {};
(function () {

var tagRegex = /<script[^>]*\ssrc=['"]([^\s'">]+)['"][\s>]/;

var load = function (html, callback) {
    var i = html.indexOf('<script');
    while (i !== -1 && i < html.length) {
        var j = html.indexOf('</script>', i + 7);
        if (j === -1) {
            throw new Error('Could not find end of script tag');
        }
        var match = tagRegex.exec(html.slice(i, j));
        if (match) {
            callback(match[1]);
        }
        i = html.indexOf('<script', j + 9);
    }
};

Loader.loadNode = function (html) {
    load(html, function (src) {
        require('../' + src);
    });
};

})();
