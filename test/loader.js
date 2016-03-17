'use strict';
var Loader = typeof exports === 'object' ? exports : {};
(function () {

var tagRegex = /<script[^>]*\ssrc=['"]([^\s'">]+)['"][\s>]/;

var parseSources = function (html) {
    var sources = [];
    var i = html.indexOf('<script');
    while (i !== -1 && i < html.length) {
        var j = html.indexOf('</script>', i + 7);
        if (j === -1) {
            throw new Error('Could not find end of script tag');
        }
        var match = tagRegex.exec(html.slice(i, j));
        if (match) {
            sources.push(match[1]);
        }
        i = html.indexOf('<script', j + 9);
    }
    return sources;
};

Loader.loadNode = function (html) {
    var sources = parseSources(html);
    sources.forEach(function (source) {
        require('../' + source);
    });
};

Loader.loadWeb = function (path, callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        var sources = parseSources(this.responseText);
        sources.forEach(function (source, i) {
            var script = document.createElement('script');
            script.setAttribute('src', path + '/' + source);
            script.async = false;
            if (i === sources.length - 1) {
                script.onload = callback;
            }
            document.body.appendChild(script);
        });
    });
    xhr.addEventListener('error', function () {
        throw new Error('could not load new.html');
    });

    xhr.open('GET', 'http://localhost:8080/new.html');
    xhr.send();
};

})();
