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

Commit.zero = 0;
Commit.Info.zero = 0;
Commit.User.zero = 0;

var newPointers = new Uint32Array(5);

Commit.initialize = function () {
    var user = createZero({
        email: $[Constants.emptyString],
        name: $[Constants.emptyString],
        timezoneOffset: Constants.$positive[0],
    });
    Commit.User.zero = $.nextIndex++;
    $[Commit.User.zero] = user;

    var info = createZero({
        author: user,
        authorTime: Constants.$positive[0],
        committer: user,
    });
    Commit.Info.zero = $.nextIndex++;
    $[Commit.Info.zero] = info;

    newPointers[Commit.committerTime] = Constants.$positive[0];
    newPointers[Commit.info] = info;
    newPointers[Commit.message] = $[Constants.emptyString];
    newPointers[Commit.parent] = 0;
    newPointers[Commit.tree] = $[Constants.emptyTree];
    Commit.zero = $.nextIndex++;
    $[Commit.zero] = ApiCreateCommit._create(newPointers);
};

})();
