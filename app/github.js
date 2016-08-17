'use strict';
global.GitHub = {};
(function () {

var clientId = '82510b72e144fe5a727b';
var apiUrl = 'https://api.github.com';

GitHub.authorize = function () {
    var redirectUri = encodeURIComponent(window.location.href);
    var scopes = 'user:email,public_repo';
    window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + redirectUri + '&scope=' + scopes;
};

GitHub.getAccessToken = function (code, callback) {
    var redirectUri = encodeURIComponent(window.location.href);
    var body = 'code=' + code + '&redirect_uri=' + redirectUri + '&client_id=' + clientId;

    var origin = window.location.origin;

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        var paramPairs = this.responseText.split('&');
        var params = {};
        paramPairs.forEach(function (pair) {
            var split = pair.split('=');
            params[split[0]] = split[1];
        });
        callback(params.access_token);
    });
    xhr.open('POST', origin + '/github-oauth/login/oauth/access_token');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(body);
};

GitHub.baseGitUrl = function (accessToken) {
    var protocol = window.location.protocol;
    var host = window.location.host;
    return protocol + '//' + accessToken + '@' + host + '/github';
};

var get = function (url, accessToken, callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        if (xhr.status === 401) {
            callback(new Error('Unauthorized'), null, xhr);
        } else {
            callback(null, this.response, xhr);
        }
    });

    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Authorization', 'token ' + accessToken);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.send();

    return xhr;
};

GitHub.repos = function (accessToken, callback) {
    var reposCallback = function (err, allRepos, xhr) {
        if (err) {
            return callback(err, null, xhr);
        }

        var spacetimeRepos = [];
        var i;
        for (i = 0; i < allRepos.length; i++) {
            var homepage = allRepos[i].homepage || '';
            if (homepage.indexOf('https://www.getspacetime.com/') >= 0) {
                spacetimeRepos.push(allRepos[i]);
            }
        }

        var linkHeader = xhr.getResponseHeader('Link');
        if (linkHeader) {
            var links = linkHeader.split(',');
            for (i = 0; i < links.length; i++) {
                var match = links[i].match(/<(.*)>; rel="next"$/);
                if (match) {
                    xhr = get(match[1], accessToken, reposCallback);
                    return;
                }
            }
        }

        callback(null, spacetimeRepos, xhr);
    };

    get(apiUrl + '/user/repos', accessToken, reposCallback);
};

})();
