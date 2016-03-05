'use strict';
global.CommitFile = {};
(function () {

var commitPrefix = GitConvert.stringToArray('commit ');
var treePrefix = GitConvert.stringToArray('tree ');
var parentPrefix = GitConvert.stringToArray('parent ');
var authorPrefix = GitConvert.stringToArray('author ');
var committerPrefix = GitConvert.stringToArray('committer ');

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

CommitFile.create = function (commit) {
    var authorName = commit.author.name; // TODO: make this safe
    var authorEmail = commit.author.email;
    var timeAuthored = '' + Math.floor(commit.author.time / 1000);
    var timezoneAuthored = CommitFile.timezoneString(commit.author.timezoneOffset);

    var committerName = commit.committer.name; // TODO: make this safe
    var committerEmail = commit.committer.email;
    var timeCommited = '' + Math.floor(commit.committer.time / 1000);
    var timezoneCommited = CommitFile.timezoneString(commit.committer.timezoneOffset);

    var message = commit.message;

    var length = constantLength;
    length += commit.parents.length * perParentLength;
    length += authorName.length + authorEmail.length + timeAuthored.length;
    length += committerName.length + committerEmail.length + timeCommited.length;
    length += message.length;

    var lengthString = '' + length;
    var commitLength = commitPrefix.length + lengthString.length + 1 + length;
    if ($Heap.nextOffset + commitLength > $Heap.capacity) {
        FileSystem.resizeHeap($FileSystem, commitLength);
    }
    var commitStart = $Heap.nextOffset;
    var commitEnd = commitStart + commitLength;
    $Heap.nextOffset = commitEnd;

    var commit_j = commitStart;
    var i;
    for (i = 0; i < commitPrefix.length; i++) {
        $[commit_j + i] = commitPrefix[i];
    }

    commit_j += i;
    for (i = 0; i < lengthString.length; i++) {
        $[commit_j + i] = lengthString.charCodeAt(i);
    }
    $[commit_j + i] = 0;

    commit_j += i + 1;
    for (i = 0; i < treePrefix.length; i++) {
        $[commit_j + i] = treePrefix[i];
    }

    commit_j += i;
    GitConvert.hashToHex($, commit.tree.hashOffset, $, commit_j);
    $[commit_j + 40] = 0x0a;

    var p, parentCommit;
    for (p = 0; p < commit.parents.length; p++) {
        commit_j += 40 + 1;
        for (i = 0; i < parentPrefix.length; i++) {
            $[commit_j + i] = parentPrefix[i];
        }

        commit_j += i;
        parentCommit = commit.parents[p];
        GitConvert.hashToHex($, parentCommit.hashOffset, $, commit_j);
        $[commit_j + 40] = 0x0a;
    }

    // author
    commit_j += 40 + 1;
    for (i = 0; i < authorPrefix.length; i++) {
        $[commit_j + i] = authorPrefix[i];
    }

    commit_j += i;
    for (i = 0; i < authorName.length; i++) {
        $[commit_j + i] = authorName.charCodeAt(i);
    }
    $[commit_j + i] = 0x20;
    $[commit_j + i + 1] = '<'.charCodeAt(0);

    commit_j += i + 2;
    for (i = 0; i < authorEmail.length; i++) {
        $[commit_j + i] = authorEmail.charCodeAt(i);
    }
    $[commit_j + i] = '>'.charCodeAt(0);
    $[commit_j + i + 1] = 0x20;

    commit_j += i + 2;
    for (i = 0; i < timeAuthored.length; i++) {
        $[commit_j + i] = timeAuthored.charCodeAt(i);
    }
    $[commit_j + i] = 0x20;

    commit_j += i + 1;
    for (i = 0; i < timezoneAuthored.length; i++) {
        $[commit_j + i] = timezoneAuthored.charCodeAt(i);
    }
    $[commit_j + i] = 0x0a;

    // committer
    commit_j += i + 1;
    for (i = 0; i < committerPrefix.length; i++) {
        $[commit_j + i] = committerPrefix[i];
    }

    commit_j += i;
    for (i = 0; i < committerName.length; i++) {
        $[commit_j + i] = committerName.charCodeAt(i);
    }
    $[commit_j + i] = 0x20;
    $[commit_j + i + 1] = '<'.charCodeAt(0);

    commit_j += i + 2;
    for (i = 0; i < committerEmail.length; i++) {
        $[commit_j + i] = committerEmail.charCodeAt(i);
    }
    $[commit_j + i] = '>'.charCodeAt(0);
    $[commit_j + i + 1] = 0x20;

    commit_j += i + 2;
    for (i = 0; i < timeCommited.length; i++) {
        $[commit_j + i] = timeCommited.charCodeAt(i);
    }
    $[commit_j + i] = 0x20;

    commit_j += i + 1;
    for (i = 0; i < timezoneCommited.length; i++) {
        $[commit_j + i] = timezoneCommited.charCodeAt(i);
    }
    $[commit_j + i] = 0x0a;
    $[commit_j + i + 1] = 0x0a;

    commit_j += i + 2;
    for (i = 0; i < message.length; i++) {
        $[commit_j + i] = message.charCodeAt(i);
    }

    return [commitStart, commitEnd];
};

CommitFile.parseTree = function (commitStart, commitEnd, hashOffset) {
    var hexOffset = $.indexOf(0, commitStart + 7) + 1 + treePrefix.length;
    GitConvert.hexToHash($, hexOffset, $, hashOffset);
};

CommitFile.parseParents = function (commitStart, commitEnd, hashesOffset) {
    var j = $.indexOf(0, commitStart + 7) + 1 + treePrefix.length + 40 + 1;
    var n = 0;
    while ($[j] === parentPrefix[0]) {
        j += parentPrefix.length;
        GitConvert.hexToHash($, j, $, hashesOffset);
        j += 40 + 1;
        hashesOffset += 20;
        n++;
    }

    return n;
};

CommitFile.parseAuthor = function (commitStart, commitEnd) {
    var j = $.indexOf(0, commitStart + 7) + 1 + treePrefix.length + 40 + 1;
    while ($[j] === parentPrefix[0]) {
        j += parentPrefix.length + 40 + 1;
    }

    j += authorPrefix.length;
    return parseAuthorOrCommitter(j);
};

CommitFile.parseCommitter = function (commitStart, commitEnd) {
    var j = $.indexOf(0, commitStart + 7) + 1 + treePrefix.length + 40 + 1;
    while ($[j] === parentPrefix[0]) {
        j += parentPrefix.length + 40 + 1;
    }

    j = $.indexOf(0x0a, j + 26);  // 26 is < min bytes for author
    j += 1 + committerPrefix.length;
    return parseAuthorOrCommitter(j);
};

var parseAuthorOrCommitter = function (nameStart) {
    var lessThanOffset = $.indexOf('<'.charCodeAt(0), nameStart);
    var nameArray = $.subarray(nameStart, lessThanOffset - 1);
    var name = String.fromCharCode.apply(null, nameArray);

    var greaterThanOffset = $.indexOf('>'.charCodeAt(0), lessThanOffset);
    var emailArray = $.subarray(lessThanOffset + 1, greaterThanOffset);
    var email = String.fromCharCode.apply(null, emailArray);

    var spaceOffset = $.indexOf(0x20, greaterThanOffset + 10);
    var secondsArray = $.subarray(greaterThanOffset + 2, spaceOffset);
    var seconds = String.fromCharCode.apply(null, secondsArray);
    var timezoneArray = $.subarray(spaceOffset + 1, spaceOffset + 6);
    var timezone = String.fromCharCode.apply(null, timezoneArray);

    var sign = timezone[0] === '+' ? -1 : +1;
    var hours = Number(timezone.slice(1, 3));
    var minutes = Number(timezone.slice(3));

    return {
        name: name,
        email: email,
        time: Number(seconds) * 1000,
        timezoneOffset: sign * (60 * hours + minutes),
    };
};

CommitFile.parseMessage = function (commitStart, commitEnd) {
    var j = $.indexOf(0, commitStart + 7) + 1 + treePrefix.length + 40 + 1;
    while ($[j] === parentPrefix[0]) {
        j += parentPrefix.length + 40 + 1;
    }

    j = $.indexOf(0x0a, j + 26);  // 26 is < min bytes for author
    j = $.indexOf(0x0a, j + 29);  // 29 is < min bytes for committer
    return String.fromCharCode.apply(null, $.subarray(j + 2, commitEnd));
};

})();
