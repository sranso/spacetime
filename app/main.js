'use strict';
global.Main = {};
(function () {

global.$head = -1;
global.$r = 0;
global.$c = 0;
global.$argIndex = 0;
global.$playFrame = -1;
global.$nextTickTime = 0;

var gitmem;

Main.initialize = function () {
    GitMem.initialize();
    gitmem = GitMem.create();

    Input.initialize();
    Cell.initialize();
    Project.initialize();

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

    Ui.initialize();
    Autocomplete.initialize();
    Autocomplete.setSelectedCell();
    Ui.draw();
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
        return;
    }

    if (!$nextTickTime) {
        $nextTickTime = now;
    }
    $nextTickTime += 33.3333333;
    window.requestAnimationFrame(Main.tick);
};

})();
