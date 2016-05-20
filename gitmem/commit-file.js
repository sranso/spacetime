'use strict';
global.CommitFile = {};
(function () {

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

    commit_j += i + 2;
    writeString(commit_j, message);

    return commitLength;
};

var writeString = function (commit_j, pointer) {
    var i;
    var type = $table.data8[Table.typeOffset(pointer)];
    if (type === Type.longString) {
        var longStringI = $table.data32[pointer >> 2];
        var string = $table.dataLongStrings[longStringI];
        for (i = 0; i < string.length; i++) {
            $file[commit_j + i] = string.charCodeAt(i);
        }
    } else {
        var length = $table.data8[pointer + Table.data8_stringLength];
        for (i = 0; i < length; i++) {
            $file[commit_j + i] = $table.data8[pointer + i];
        }
    }
    return commit_j + i;
};

CommitFile.parseTree = function ($c, commitStart, commitEnd, $t, treeHashOffset) {
    var hexOffset = $c.indexOf(0, commitStart + 7) + 1 + treePrefix.length;
    Convert.hexToHash($c, hexOffset, $t, treeHashOffset);
};

CommitFile.parseParents = function ($c, commitStart, commitEnd, $p, parentHashesOffset) {
    var j = $c.indexOf(0, commitStart + 7) + 1 + treePrefix.length + 40 + 1;
    var n = 0;
    while ($c[j] === parentPrefix[0]) {
        j += parentPrefix.length;
        Convert.hexToHash($c, j, $p, parentHashesOffset);
        j += 40 + 1;
        parentHashesOffset += 20;
        n++;
    }

    return n;
};

CommitFile.parse = function ($f, fileStart, fileEnd, commit) {
    var j = $f.indexOf(0, fileStart + 7) + 1 + treePrefix.length + 40 + 1;
    while ($f[j] === parentPrefix[0]) {
        j += parentPrefix.length + 40 + 1;
    }

    // author
    j += authorPrefix.length;
    var nameArray = $f.subarray(j, $f.indexOf('<'.charCodeAt(0), j) - 1);
    commit.authorName = String.fromCharCode.apply(null, nameArray);

    j += nameArray.length + 1 + 1;
    var emailArray = $f.subarray(j, $f.indexOf('>'.charCodeAt(0), j));
    commit.authorEmail = String.fromCharCode.apply(null, emailArray);

    j += emailArray.length + 1 + 1;
    var secondsArray = $f.subarray(j, $f.indexOf(0x20, j + 8));
    var seconds = String.fromCharCode.apply(null, secondsArray);
    commit.authorTime = Number(seconds) * 1000;

    j += secondsArray.length + 1;
    var timezoneArray = $f.subarray(j, j + 5);
    var timezone = String.fromCharCode.apply(null, timezoneArray);
    commit.authorTimezoneOffset = timezoneOffsetFromString(timezone);

    // committer
    j += timezoneArray.length + 1 + committerPrefix.length;
    nameArray = $f.subarray(j, $f.indexOf('<'.charCodeAt(0), j) - 1);
    commit.committerName = String.fromCharCode.apply(null, nameArray);

    j += nameArray.length + 1 + 1;
    emailArray = $f.subarray(j, $f.indexOf('>'.charCodeAt(0), j));
    commit.committerEmail = String.fromCharCode.apply(null, emailArray);

    j += emailArray.length + 1 + 1;
    secondsArray = $f.subarray(j, $f.indexOf(0x20, j + 8));
    seconds = String.fromCharCode.apply(null, secondsArray);
    commit.committerTime = Number(seconds) * 1000;

    j += secondsArray.length + 1;
    timezoneArray = $f.subarray(j, j + 5);
    timezone = String.fromCharCode.apply(null, timezoneArray);
    commit.committerTimezoneOffset = timezoneOffsetFromString(timezone);

    j += timezoneArray.length + 1 + 1;
    var messageArray = $f.subarray(j, fileEnd);
    commit.message = String.fromCharCode.apply(null, messageArray);
};

var timezoneOffsetFromString = function (timezone) {
    var sign = timezone[0] === '+' ? -1 : +1;
    var hours = Number(timezone.slice(1, 3));
    var minutes = Number(timezone.slice(3));
    return sign * (60 * hours + minutes);
};

})();
