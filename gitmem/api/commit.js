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
var tempHash = new Uint8Array(20);

Commit.initialize = function () {
    var user = createZero({
        email: $[Constants.emptyString],
        name: $[Constants.emptyString],
        timezoneOffset: $[Constants.positive[0]],
    });
    Commit.User.zero = user;

    Commit.Info.zero = createZero({
        author: user,
        authorTime: $[Constants.positive[0]],
        committer: user,
    });

    newPointers[Commit.committerTime] = $[Constants.positive[0]];
    newPointers[Commit.info] = Commit.Info.zero;
    newPointers[Commit.message] = $[Constants.emptyString];
    newPointers[Commit.parent] = 0;
    newPointers[Commit.tree] = $[Constants.emptyTree];
    Commit.zero = create();
};

global.commit = function (pointer) {
    var pointer32 = pointer >> 2;
    var i;
    for (i = 0; i < 5; i++) {
        newPointers[i] = $table.data32[pointer32 + i];
    }

    for (i = 1; i < arguments.length; i += 2) {
        var childIndex = arguments[i];
        if (childIndex >= 5) {
            throw new Error('Trying to set child ' + childIndex + ' out of 5');
        }
        newPointers[childIndex] = arguments[i + 1];
    }

    return create();
};

var create = function () {
    // Create commit file
    var commitLength = CommitFile.create(newPointers, 0);

    // Hash and store in table
    Sha1.hash($file, 0, commitLength, tempHash, 0);
    var pointer = Table.findPointer($table, tempHash, 0);
    if (pointer > 0) {
        return pointer;
    }

    pointer = ~pointer;
    Table.setHash($table, pointer, tempHash, 0);
    var pointer32 = pointer >> 2;
    $table.data8[Table.typeOffset(pointer)] = Type.commit;
    var i;
    for (i = 0; i < 5; i++) {
        $table.data32[pointer32 + i] = newPointers[i];
    }

    return pointer;
};

})();
