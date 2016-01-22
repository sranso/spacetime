var paramPairs = window.location.search.slice(1).split('&');
var params = {};
paramPairs.forEach(function (pair) {
    var split = pair.split('=');
    params[split[0]] = split[1];
});

var clientId = '82510b72e144fe5a727b';
var redirectUri = encodeURIComponent('http://localhost:8080/test-github.html');
var code = params.code;

if (params.error) {
    var errorDiv = document.createElement('div');
    errorDiv.innerHTML = decodeURIComponent(params.error_description).replace(/\+/g, ' ');
    document.body.appendChild(errorDiv);
} else if (params.code) {
    var body = 'code=' + code + '&redirect_uri=' + redirectUri + '&client_id=' + clientId;

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        var paramPairs = this.responseText.split('&');
        var params = {};
        paramPairs.forEach(function (pair) {
            var split = pair.split('=');
            params[split[0]] = split[1];
        });
        main(params.access_token);
    });
    xhr.open('POST', 'http://localhost:8080/github_oauth/login/oauth/access_token');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(body);
} else {
    var scopes = 'user:email,public_repo';
    window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + redirectUri + '&scope=' + scopes;
}

var main = function (accessToken) {
    window.history.replaceState({}, '', 'test-github.html');
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
    });

    xhr.open('GET', 'http://' + accessToken + '@localhost:8080/github/jakesandlund/golangoutyet.git/info/refs?service=git-upload-pack');
    xhr.send();
};
