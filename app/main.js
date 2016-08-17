'use strict';
global.Main = {};
(function () {

global.$head = 0;
global.$redoHead = 0;
global.$r = 0;
global.$c = 0;
global.$argIndex = 0;
global.$playFrame = -1;
global.$nextTickTime = 0;
global.$fullscreen = false;
global.$showResults = false;
global.$resultTitle = '';
global.$results = [];

var gitmem;

var refName = 'refs/heads/master';

var getGitHubAccessToken = function (callback) {
    var params = parseParams();

    // http://stackoverflow.com/questions/20325763/browser-sessionstorage-share-between-tabs
    window.addEventListener('storage', function (event) {
        if (!event.newValue) {
            return;
        }

        if (event.key === 'getSessionStorage') {
            propogateSessionStorage();
        } else if (event.key === 'sessionStorage') {
            var session = JSON.parse(event.newValue);
            var key;
            for (key in session) {
                window.sessionStorage.setItem(key, session[key]);
            }
        }
    });

    if (params.error) {
        var errorDiv = document.createElement('div');
        errorDiv.innerHTML = decodeURIComponent(params.error_description).replace(/\+/g, ' ');
        document.body.appendChild(errorDiv);
        return;
    } else if (params.code) {
        window.history.replaceState({}, '', window.location.pathname);
        GitHub.getAccessToken(params.code, function (accessToken) {
            window.sessionStorage.setItem('githubAccessToken', accessToken);
            propogateSessionStorage();
            callback();
        });
        return;
    } else if (!window.sessionStorage.length) {
        localStorage.setItem('getSessionStorage', 'request sessionStorage');
        localStorage.removeItem('getSessionStorage');

        window.setTimeout(function () {
            if (window.sessionStorage.length) {
                callback();
            } else {
                GitHub.authorize();
            }
        }, 30);
        return;
    }

    callback();
};

var propogateSessionStorage = function () {
    window.localStorage.setItem('sessionStorage', JSON.stringify({
        githubAccessToken: window.sessionStorage.githubAccessToken,
    }));
    window.localStorage.removeItem('sessionStorage');
};

Main.initialize = function () {
    getGitHubAccessToken(postGitHubInit);
};

var postGitHubInit = function () {
    GitMem.initialize();
    gitmem = GitMem.create();

    Input.initialize();
    Cell.initialize();
    Project.initialize();
    Ui.initialize();
    Autocomplete.initialize();

    if (window.sessionStorage.gitUrl) {
        Main.initializeRepo();
    } else {
        Main.listRepos();
    }
};

Main.listRepos = function () {
    var accessToken = window.sessionStorage.githubAccessToken;

    GitHub.repos(accessToken, function (err, repos, xhr) {
        if (err && xhr.status === 401) {
            return GitHub.authorize();
        }

        $showResults = true;
        $resultTitle = 'List of repositories';
        $results = [];
        var lenCells = Math.floor((window.innerHeight - 200) / Ui.ySpacing);
        if (lenCells > repos.length) {
            lenCells = repos.length;
        }
        var lenColumns = Math.ceil(repos.length / lenCells);
        var emptyResult = {text: ''};
        var c;
        for (c = 0; c < lenColumns; c++) {
            $results[c] = [];
            var r;
            for (r = 0; r < lenCells; r++) {
                var result = repos[c * lenCells + r] || emptyResult;
                $results[c][r] = {
                    text: result.name,
                    fullName: result.full_name,
                };
            }
        }

        firstDraw();
    });
};

var firstDraw = function () {
    Autocomplete.setSelectedCell();
    Autocomplete.show();
    Ui.draw();

    /*
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
    });

    //var url = GitHub.baseGitUrl($githubAccessToken) + '/jakesandlund/golangoutyet.git/info/refs?service=git-upload-pack';
    xhr.open('GET', url);

    xhr.send();
    */
};

var parseParams = function () {
    var paramPairs = window.location.search.slice(1).split('&');
    var params = {};
    paramPairs.forEach(function (pair) {
        var split = pair.split('=');
        params[split[0]] = split[1];
    });

    return params;
};

Main.initializeRepo = function () {
    var gitUrl = window.sessionStorage.gitUrl;

    Remote.queryRef(gitUrl, refName, function (remoteCommit) {
        if (remoteCommit === $[Constants.zeroHash]) {
            initializeNew();
            firstDraw();
        } else {
            Remote.fetch(gitUrl, remoteCommit, $[Constants.zeroHash], function () {
                $head = remoteCommit;
                $redoHead = $head;
                firstDraw();
            });
        }
    });
};

var initializeNew = function () {
    var project = $[Project.zero];

    var user = set($[Commit.User.zero],
                    Commit.User.name, hash('Jake Sandlund'),
                    Commit.User.email, hash('jake@jakesandlund.com'),
                    Commit.User.timezoneOffset, hash(360));

    var info = set($[Commit.Info.zero],
                    Commit.Info.author, user,
                    Commit.Info.committer, user);

    var now = Math.round(+Date.now() / 1000);

    $head = createCommit($[Commit.zero],
                         Commit.info, info,
                         Commit.tree, project,
                         Commit.parent, 0,
                         Commit.committerTime, now,
                         Commit.message, hash('automatic commit'));
    $redoHead = $head;
};

Main.save = function () {
    Remote.queryRef(gitUrl, refName, function (remoteCommit) {
        var packLength = Pack.create($head);
        Remote.push(gitUrl, refName, remoteCommit, $head, packLength, function (response) {
            // TODO: error handling
        });
    });
};

Main.tick = function (now) {
    if ($playFrame < 0) {
        return;
    }

    var timeToNextTick = $nextTickTime - now;
    if (timeToNextTick > 10 && $nextTickTime !== 0) {
        window.requestAnimationFrame(Main.tick);
        return;
    }

    Input.capture();
    Ui.draw();

    var project = get($head, Commit.tree);
    var parentCell = get(project, Project.cell);
    var columns = get(parentCell, Cell.columns);

    $playFrame++;
    if ($playFrame >= len(columns)) {
        $playFrame = -1;
        Autocomplete.show();
        return;
    }

    if (!$nextTickTime) {
        $nextTickTime = now;
    }
    $nextTickTime += 33.3333333;
    window.requestAnimationFrame(Main.tick);
};

})();
