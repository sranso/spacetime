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

var gitmem;

var gitUrl = 'http://localhost:8080/local-git/spacetime1.git';
var refName = 'refs/heads/master';

Main.initialize = function () {
    GitMem.initialize();
    gitmem = GitMem.create();

    Input.initialize();
    Cell.initialize();
    Project.initialize();

    initializeRepo(function () {
        Ui.initialize();
        Autocomplete.initialize();
        Ui.draw();
    });
};

var initializeRepo = function (callback) {
    Remote.queryRef(gitUrl, refName, function (remoteCommit) {
        if (remoteCommit === $[Constants.zeroHash]) {
            initializeNew();
            callback();
        } else {
            Remote.fetch(gitUrl, remoteCommit, $[Constants.zeroHash], function () {
                $head = remoteCommit;
                $redoHead = $head;
                callback();
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
