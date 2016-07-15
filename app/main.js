'use strict';
global.Main = {};
(function () {

global.$head = -1;
global.$r = 0;
global.$c = 0;
global.$argIndex = 0;

var gitmem;

Main.initialize = function () {
    GitMem.initialize();
    gitmem = GitMem.create();

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
                         Commit.message, hash('Initial commit'));

    Ui.initialize();
    Autocomplete.initialize();
    Autocomplete.setSelectedCell();
    Main.update();
};

Main.update = function () {
    Ui.draw();
};

})();
