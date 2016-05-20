'use strict';
global.Commit = {};
(function () {

Commit.committerTime = 0;
Commit.info = 1;
Commit.message = 2;
Commit.parent = 3;
Commit.tree = 4;

Commit.Info = {};
Commit.Info.author = 0;
Commit.Info.authorTime = 1;
Commit.Info.committer = 2;

Commit.User = {};
Commit.User.email = 0;
Commit.User.name = 1;
Commit.User.timezoneOffset = 2;

Commit.defaults = 0;
Commit.Info.defaults = 0;
Commit.User.defaults = 0;


Commit.initialize = function () {
    var user = createDefaults({
        email: hash('test@example.com'),
        name: hash('User Name'),
        timezoneOffset: hash(360),
    });
    Commit.User.defaults = user;

    Commit.Info.defaults = createDefaults({
        author: user,
        authorTime: Constants.zero,
        committer: user,
    });

    var message = hash('Commit message');
    var commitLength = CommitFile.create({
        tree: Constants.emptyTree,
        parent: 0,
        mergeParent: 0,

        authorName: val(get(user, Commit.User.name)),
        authorEmail: val(get(user, Commit.User.email)),
        authorTime: Constants.zero,
        authorTimezoneOffset: val(get(user, Commit.User.timezoneOffset)),

        committerName: val(get(user, Commit.User.name)),
        committerEmail: val(get(user, Commit.User.email)),
        committerTime: Constants.zero,
        committerTimezoneOffset: val(get(user, Commit.User.timezoneOffset)),

        message: message,
    });

    var commitHash = new Uint8Array(20);
    Sha1.hash($file, 0, commitLength, commitHash, 0);
    Commit.defaults = ~Table.findPointer($table, commitHash, 0);
    Table.setHash($table, Commit.defaults, commitHash, 0);
    $table.data8[Table.typeOffset(Commit.defaults)] = Type.commit;

    var pointer32 = Commit.defaults >> 2;
    $table.data32[pointer32 + Commit.committerTime] = Constants.zero;
    $table.data32[pointer32 + Commit.info] = Commit.Info.defaults;
    $table.data32[pointer32 + Commit.message] = message;
    $table.data32[pointer32 + Commit.parent] = 0;
    $table.data32[pointer32 + Commit.tree] = Constants.emptyTree;
};

})();
