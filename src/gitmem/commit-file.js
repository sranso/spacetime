'use strict';
global.CommitFile = {};
(function () {

var commitPrefix = Convert.stringToArray('commit ');
var treePrefix = Convert.stringToArray('tree ');
var parentPrefix = Convert.stringToArray('parent ');
var authorPrefix = Convert.stringToArray('author ');
var committerPrefix = Convert.stringToArray('committer ');

CommitFile._initialStart = -1;
CommitFile._initialEnd = -1;
CommitFile.initialHashOffset = -1;

CommitFile.initialize = function () {
    var $h = $heap.array;

    CommitFile._initialStart = $heap.nextOffset;
    var initialCommitString = (
        'commit 189\0tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904\n' +
        'author Jake Sandlund <jake@jakesandlund.com> 1457216632 -0600\n' +
        'committer Jake Sandlund <jake@jakesandlund.com> 1457216632 -0600\n' +
        '\n' +
        'Initial commit\n'
    );
    Convert.stringToExistingArray($h, CommitFile._initialStart, initialCommitString);
    CommitFile._initialEnd = CommitFile._initialStart + initialCommitString.length;
    $heap.nextOffset = CommitFile._initialEnd;

    CommitFile.initialHashOffset = $heap.nextOffset;
    Sha1.hash($h, CommitFile._initialStart, CommitFile._initialEnd, $h, CommitFile.initialHashOffset);
    $heap.nextOffset += 20;
};

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

CommitFile.create = function (commit, fileRange) {
    var authorName = commit.authorName; // TODO: make this safe
    var authorEmail = commit.authorEmail;
    var authorTime = '' + Math.floor(commit.authorTime / 1000);
    var authorTimezone = CommitFile.timezoneString(commit.authorTimezoneOffset);

    var committerName = commit.committerName; // TODO: make this safe
    var committerEmail = commit.committerEmail;
    var committerTime = '' + Math.floor(commit.committerTime / 1000);
    var committerTimezone = CommitFile.timezoneString(commit.committerTimezoneOffset);

    var message = commit.message;

    var length = constantLength;
    if (commit.mergeParent) {
        length += 2 * perParentLength;
    } else {
        length += 1 * perParentLength;
    }
    length += authorName.length + authorEmail.length + authorTime.length;
    length += committerName.length + committerEmail.length + committerTime.length;
    length += message.length;

    var lengthString = '' + length;
    var commitLength = commitPrefix.length + lengthString.length + 1 + length;
    FileCache.malloc($fileCache, commitLength);
    var commitStart = $fileCache.nextArrayOffset;
    var commitEnd = commitStart + commitLength;
    $fileCache.nextArrayOffset = commitEnd;

    var $f = $fileCache.array;

    var commit_j = commitStart;
    var i;
    for (i = 0; i < commitPrefix.length; i++) {
        $f[commit_j + i] = commitPrefix[i];
    }

    commit_j += i;
    for (i = 0; i < lengthString.length; i++) {
        $f[commit_j + i] = lengthString.charCodeAt(i);
    }
    $f[commit_j + i] = 0;

    commit_j += i + 1;
    for (i = 0; i < treePrefix.length; i++) {
        $f[commit_j + i] = treePrefix[i];
    }

    commit_j += i;
    Convert.hashToHex($hashTable.array, commit.tree.hashOffset, $f, commit_j);
    $f[commit_j + 40] = 0x0a;

    // parent
    commit_j += 40 + 1;
    for (i = 0; i < parentPrefix.length; i++) {
        $f[commit_j + i] = parentPrefix[i];
    }

    commit_j += i;
    Convert.hashToHex($hashTable.array, commit.parent.hashOffset, $f, commit_j);
    $f[commit_j + 40] = 0x0a;

    // mergeParent
    if (commit.mergeParent) {
        commit_j += 40 + 1;
        for (i = 0; i < parentPrefix.length; i++) {
            $f[commit_j + i] = parentPrefix[i];
        }

        commit_j += i;
        Convert.hashToHex($hashTable.array, commit.mergeParent.hashOffset, $f, commit_j);
        $f[commit_j + 40] = 0x0a;
    }

    // author
    commit_j += 40 + 1;
    for (i = 0; i < authorPrefix.length; i++) {
        $f[commit_j + i] = authorPrefix[i];
    }

    commit_j += i;
    for (i = 0; i < authorName.length; i++) {
        $f[commit_j + i] = authorName.charCodeAt(i);
    }
    $f[commit_j + i] = 0x20;
    $f[commit_j + i + 1] = '<'.charCodeAt(0);

    commit_j += i + 2;
    for (i = 0; i < authorEmail.length; i++) {
        $f[commit_j + i] = authorEmail.charCodeAt(i);
    }
    $f[commit_j + i] = '>'.charCodeAt(0);
    $f[commit_j + i + 1] = 0x20;

    commit_j += i + 2;
    for (i = 0; i < authorTime.length; i++) {
        $f[commit_j + i] = authorTime.charCodeAt(i);
    }
    $f[commit_j + i] = 0x20;

    commit_j += i + 1;
    for (i = 0; i < authorTimezone.length; i++) {
        $f[commit_j + i] = authorTimezone.charCodeAt(i);
    }
    $f[commit_j + i] = 0x0a;

    // committer
    commit_j += i + 1;
    for (i = 0; i < committerPrefix.length; i++) {
        $f[commit_j + i] = committerPrefix[i];
    }

    commit_j += i;
    for (i = 0; i < committerName.length; i++) {
        $f[commit_j + i] = committerName.charCodeAt(i);
    }
    $f[commit_j + i] = 0x20;
    $f[commit_j + i + 1] = '<'.charCodeAt(0);

    commit_j += i + 2;
    for (i = 0; i < committerEmail.length; i++) {
        $f[commit_j + i] = committerEmail.charCodeAt(i);
    }
    $f[commit_j + i] = '>'.charCodeAt(0);
    $f[commit_j + i + 1] = 0x20;

    commit_j += i + 2;
    for (i = 0; i < committerTime.length; i++) {
        $f[commit_j + i] = committerTime.charCodeAt(i);
    }
    $f[commit_j + i] = 0x20;

    commit_j += i + 1;
    for (i = 0; i < committerTimezone.length; i++) {
        $f[commit_j + i] = committerTimezone.charCodeAt(i);
    }
    $f[commit_j + i] = 0x0a;
    $f[commit_j + i + 1] = 0x0a;

    commit_j += i + 2;
    for (i = 0; i < message.length; i++) {
        $f[commit_j + i] = message.charCodeAt(i);
    }

    fileRange[0] = commitStart;
    fileRange[1] = commitEnd;
    return fileRange;
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
