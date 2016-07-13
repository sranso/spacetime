'use strict';
global.Main = {};
(function () {

global.$head = -1;
global.$r = -1;
global.$c = -1;

var gitmem;

Main.initialize = function () {
    GitMem.initialize();
    gitmem = GitMem.create();

    Cell.initialize();
    Project.initialize();

    var cell = set($[Cell.zero],
                   Cell.text, hash('Wust some jhort txmM'));

    var cell2 = set($[Cell.zero],
                    Cell.text, hash('+'));

    var cell3 = set($[Cell.zero],
                    Cell.text, hash('delete right columns'));

    var cell4 = set($[Cell.zero],
                    Cell.text, hash('mouse x'));

    var cell5 = set($[Cell.zero],
                    Cell.text, hash('juxtapose'));

    var column = push(ArrayTree.$zeros[0], cell);
    column = push(push(push(push(column, cell2), cell5), cell3), cell4);
    var columns = push(ArrayTree.$zeros[0], column);
    columns = push(push(push(push(columns, column), column), column), column);
    var topCell = set($[Cell.zero], Cell.columns, columns);

    var project = set($[Project.zero],
                      Project.cell, topCell);

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
    Main.update();
};

Main.update = function () {
    Ui.draw();
};

})();
