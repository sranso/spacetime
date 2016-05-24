'use strict';
global.CommitFile = {};
(function () {

var tempHash = new Uint8Array(20);

var commitPrefix = Convert.stringToArray('commit ');
var treePrefix = Convert.stringToArray('tree ');
var parentPrefix = Convert.stringToArray('parent ');
var authorPrefix = Convert.stringToArray('author ');
var committerPrefix = Convert.stringToArray('committer ');

CommitFile.timezoneString = function (timezoneOffset) {
    var absOffset = Math.abs(timezoneOffset);
    var hoursNumber = Math.floor(absOffset / 60);
    var minutesNumber = absOffset - 60 * hoursNumber;
    var sign = -timezoneOffset >= 0 ? '+' : '-';
    var hours = hoursNumber > 9 ? hoursNumber : '0' + hoursNumber;
    var minutes = minutesNumber > 9 ? minutesNumber : '0' + minutesNumber;
    return sign + hours + minutes;
};

var constantLength = 'tree \nauthor  <>  -0600\ncommitter  <>  -0600\n\n'.length;
constantLength += 40;
var perParentLength = parentPrefix.length + 40 + 1;

CommitFile.create = function (data32, pointer32) {
    var tree = data32[pointer32 + Commit.tree];
    var parent = data32[pointer32 + Commit.parent];
    var info = data32[pointer32 + Commit.info];
    var message = data32[pointer32 + Commit.message];

    var author = get(info, Commit.Info.author);
    var committer = get(info, Commit.Info.committer);

    var committerTime = val(data32[pointer32 + Commit.committerTime]);
    var authorTime = val(get(info, Commit.Info.authorTime)) || committerTime;

    var authorName = get(author, Commit.User.name);
    var authorEmail = get(author, Commit.User.email);
    var authorTimezone = CommitFile.timezoneString(val(get(author, Commit.User.timezoneOffset)));
    authorTime = '' + authorTime;

    var committerName = get(committer, Commit.User.name);
    var committerEmail = get(committer, Commit.User.email);
    var committerTimezone = CommitFile.timezoneString(val(get(committer, Commit.User.timezoneOffset)));
    committerTime = '' + committerTime;

    var length = constantLength;
    if (parent) {
        length += 1 * perParentLength;
    }
    length += (
        $table.data8[message + Table.data8_stringLength] +
        $table.data8[authorName + Table.data8_stringLength] +
        $table.data8[authorEmail + Table.data8_stringLength] +
        $table.data8[committerName + Table.data8_stringLength] +
        $table.data8[committerEmail + Table.data8_stringLength] +
        authorTime.length + committerTime.length
    );

    var lengthString = '' + length;
    var commitLength = commitPrefix.length + lengthString.length + 1 + length;

    var i;
    for (i = 0; i < commitPrefix.length; i++) {
        $file[i] = commitPrefix[i];
    }

    var commit_j = i;
    for (i = 0; i < lengthString.length; i++) {
        $file[commit_j + i] = lengthString.charCodeAt(i);
    }
    $file[commit_j + i] = 0;

    // tree
    commit_j += i + 1;
    for (i = 0; i < treePrefix.length; i++) {
        $file[commit_j + i] = treePrefix[i];
    }

    commit_j += i;
    Convert.hashToHex($table.hashes8, tree, $file, commit_j);
    $file[commit_j + 40] = 0x0a;

    // parent
    if (parent) {
        commit_j += 40 + 1;
        for (i = 0; i < parentPrefix.length; i++) {
            $file[commit_j + i] = parentPrefix[i];
        }

        commit_j += i;
        Convert.hashToHex($table.hashes8, parent, $file, commit_j);
        $file[commit_j + 40] = 0x0a;
    }

    // author
    commit_j += 40 + 1;
    for (i = 0; i < authorPrefix.length; i++) {
        $file[commit_j + i] = authorPrefix[i];
    }

    commit_j += i;
    commit_j = writeString(commit_j, authorName);
    $file[commit_j] = 0x20;
    $file[commit_j + 1] = '<'.charCodeAt(0);

    commit_j += 2;
    commit_j = writeString(commit_j, authorEmail);
    $file[commit_j] = '>'.charCodeAt(0);
    $file[commit_j + 1] = 0x20;

    commit_j += 2;
    for (i = 0; i < authorTime.length; i++) {
        $file[commit_j + i] = authorTime.charCodeAt(i);
    }
    $file[commit_j + i] = 0x20;

    commit_j += i + 1;
    for (i = 0; i < authorTimezone.length; i++) {
        $file[commit_j + i] = authorTimezone.charCodeAt(i);
    }
    $file[commit_j + i] = 0x0a;

    // committer
    commit_j += i + 1;
    for (i = 0; i < committerPrefix.length; i++) {
        $file[commit_j + i] = committerPrefix[i];
    }

    commit_j += i;
    commit_j = writeString(commit_j, committerName);
    $file[commit_j] = 0x20;
    $file[commit_j + 1] = '<'.charCodeAt(0);

    commit_j += 2;
    commit_j = writeString(commit_j, committerEmail);
    $file[commit_j] = '>'.charCodeAt(0);
    $file[commit_j + 1] = 0x20;

    commit_j += 2;
    for (i = 0; i < committerTime.length; i++) {
        $file[commit_j + i] = committerTime.charCodeAt(i);
    }
    $file[commit_j + i] = 0x20;

    commit_j += i + 1;
    for (i = 0; i < committerTimezone.length; i++) {
        $file[commit_j + i] = committerTimezone.charCodeAt(i);
    }
    $file[commit_j + i] = 0x0a;
    $file[commit_j + i + 1] = 0x0a;

    // message
    commit_j += i + 2;
    writeString(commit_j, message);

    return commitLength;
};

var writeString = function (commit_j, pointer) {
    var i;
    var type = $table.data8[Table.typeOffset(pointer)] & Type.mask;
    if (type === Type.longString) {
        var longStringI = $table.data32[pointer >> 2];
        var string = $table.dataLongStrings[longStringI];
        for (i = 0; i < string.length; i++) {
            $file[commit_j + i] = string.charCodeAt(i);
        }
    } else if (type === Type.string) {
        var length = $table.data8[pointer + Table.data8_stringLength];
        for (i = 0; i < length; i++) {
            $file[commit_j + i] = $table.data8[pointer + i];
        }
    } else {
        throw new Error('Trying to write non-string type: ' + type);
    }
    return commit_j + i;
};

CommitFile.unpack = function (fileLength, data32, pointer32) {
    // tree
    var j = $file.indexOf(0, 7) + 1 + treePrefix.length;
    Convert.hexToHash($file, j, tempHash, 0);
    var tree = Table.findPointer($table, tempHash, 0);
    if (tree < 0) {
        tree = ~tree;
        Table.setHash($table, tree, tempHash, 0);
        $table.data8[Table.typeOffset(tree)] = Type.pending;
    }
    data32[pointer32 + Commit.tree] = tree;

    // parent
    j += 40 + 1;
    if ($file[j] === parentPrefix[0]) {
        j += parentPrefix.length;
        Convert.hexToHash($file, j, tempHash, 0);
        var parent = Table.findPointer($table, tempHash, 0);
        if (parent < 0) {
            parent = ~parent;
            Table.setHash($table, parent, tempHash, 0);
            $table.data8[Table.typeOffset(parent)] = Type.pending;
        }
        data32[pointer32 + Commit.parent] = parent;
        j += 40 + 1;
    }

    if ($file[j] === parentPrefix[0]) {
        throw new Error('Merge commits not supported, yet');
    }

    // author
    j += authorPrefix.length;
    var nameArray = $file.subarray(j, $file.indexOf('<'.charCodeAt(0), j) - 1);
    var authorName = String.fromCharCode.apply(null, nameArray);

    j += nameArray.length + 1 + 1;
    var emailArray = $file.subarray(j, $file.indexOf('>'.charCodeAt(0), j));
    var authorEmail = String.fromCharCode.apply(null, emailArray);

    j += emailArray.length + 1 + 1;
    var secondsArray = $file.subarray(j, $file.indexOf(0x20, j + 8));
    var seconds = String.fromCharCode.apply(null, secondsArray);
    var authorTime = Number(seconds);

    j += secondsArray.length + 1;
    var timezoneArray = $file.subarray(j, j + 5);
    var timezone = String.fromCharCode.apply(null, timezoneArray);
    var authorTimezoneOffset = timezoneOffsetFromString(timezone);

    // committer
    j += timezoneArray.length + 1 + committerPrefix.length;
    nameArray = $file.subarray(j, $file.indexOf('<'.charCodeAt(0), j) - 1);
    var committerName = String.fromCharCode.apply(null, nameArray);

    j += nameArray.length + 1 + 1;
    emailArray = $file.subarray(j, $file.indexOf('>'.charCodeAt(0), j));
    var committerEmail = String.fromCharCode.apply(null, emailArray);

    j += emailArray.length + 1 + 1;
    secondsArray = $file.subarray(j, $file.indexOf(0x20, j + 8));
    seconds = String.fromCharCode.apply(null, secondsArray);
    var committerTime = Number(seconds);

    j += secondsArray.length + 1;
    timezoneArray = $file.subarray(j, j + 5);
    timezone = String.fromCharCode.apply(null, timezoneArray);
    var committerTimezoneOffset = timezoneOffsetFromString(timezone);

    // message
    j += timezoneArray.length + 1 + 1;
    var messageArray = $file.subarray(j, fileLength);
    var message = String.fromCharCode.apply(null, messageArray);


    // build info
    var author = set($[Commit.User.zero],
                     Commit.User.name, hash(authorName),
                     Commit.User.email, hash(authorEmail),
                     Commit.User.timezoneOffset, hash(authorTimezoneOffset));

    var committer = set($[Commit.User.zero],
                        Commit.User.name, hash(committerName),
                        Commit.User.email, hash(committerEmail),
                        Commit.User.timezoneOffset, hash(committerTimezoneOffset));

    if (authorTime === committerTime) {
        authorTime = Constants.$positive[0];
    } else {
        authorTime = hash(authorTime);
    }
    var info = set($[Commit.Info.zero],
                   Commit.Info.author, author,
                   Commit.Info.committer, committer,
                   Commit.Info.authorTime, authorTime);

    // save back to data32
    data32[pointer32 + Commit.info] = info;
    data32[pointer32 + Commit.committerTime] = hash(committerTime);
    data32[pointer32 + Commit.message] = hash(message);
};

var timezoneOffsetFromString = function (timezone) {
    var sign = timezone[0] === '+' ? -1 : +1;
    var hours = Number(timezone.slice(1, 3));
    var minutes = Number(timezone.slice(3));
    return sign * (60 * hours + minutes);
};

})();
