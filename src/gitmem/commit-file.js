'use strict';
global.CommitFile = {};
(function () {

var commitPrefix = GitFile.stringToArray('commit ');
var treePrefix = GitFile.stringToArray('tree ');
var parentPrefix = GitFile.stringToArray('parent ');
var authorPrefix = GitFile.stringToArray('author ');
var committerPrefix = GitFile.stringToArray('committer ');

CommitFile.catFile = function (file) {
    var type = String.fromCharCode.apply(null, file.subarray(0, file.indexOf(0x20, 4)));

    if (type !== 'commit') {
        throw new Error('Unexpected type: ' + type);
    }

    var j = file.indexOf(0, 8) + 1;
    var rest = file.subarray(j);
    return String.fromCharCode.apply(null, rest);
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

CommitFile.createFromObject = function (commit) {
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
    var file = new Uint8Array(commitPrefix.length + lengthString.length + 1 + length);

    var i;
    for (i = 0; i < commitPrefix.length; i++) {
        file[i] = commitPrefix[i];
    }

    var j = i;
    for (i = 0; i < lengthString.length; i++) {
        file[j + i] = lengthString.charCodeAt(i);
    }
    file[j + i] = 0;

    j += i + 1;
    for (i = 0; i < treePrefix.length; i++) {
        file[j + i] = treePrefix[i];
    }

    j += i;
    GitFile.hashToHex(commit.tree.hash, commit.tree.hashOffset, file, j);
    file[j + 40] = 0x0a;

    var p, parentCommit;
    for (p = 0; p < commit.parents.length; p++) {
        j += 40 + 1;
        for (i = 0; i < parentPrefix.length; i++) {
            file[j + i] = parentPrefix[i];
        }

        j += i;
        parentCommit = commit.parents[p];
        GitFile.hashToHex(parentCommit.hash, parentCommit.hashOffset, file, j);
        file[j + 40] = 0x0a;
    }

    // author
    j += 40 + 1;
    for (i = 0; i < authorPrefix.length; i++) {
        file[j + i] = authorPrefix[i];
    }

    j += i;
    for (i = 0; i < authorName.length; i++) {
        file[j + i] = authorName.charCodeAt(i);
    }
    file[j + i] = 0x20;
    file[j + i + 1] = 0x3c; // '<'

    j += i + 2;
    for (i = 0; i < authorEmail.length; i++) {
        file[j + i] = authorEmail.charCodeAt(i);
    }
    file[j + i] = 0x3e; // '>'
    file[j + i + 1] = 0x20;

    j += i + 2;
    for (i = 0; i < timeAuthored.length; i++) {
        file[j + i] = timeAuthored.charCodeAt(i);
    }
    file[j + i] = 0x20;

    j += i + 1;
    for (i = 0; i < timezoneAuthored.length; i++) {
        file[j + i] = timezoneAuthored.charCodeAt(i);
    }
    file[j + i] = 0x0a;

    // committer
    j += i + 1;
    for (i = 0; i < committerPrefix.length; i++) {
        file[j + i] = committerPrefix[i];
    }

    j += i;
    for (i = 0; i < committerName.length; i++) {
        file[j + i] = committerName.charCodeAt(i);
    }
    file[j + i] = 0x20;
    file[j + i + 1] = 0x3c; // '<'

    j += i + 2;
    for (i = 0; i < committerEmail.length; i++) {
        file[j + i] = committerEmail.charCodeAt(i);
    }
    file[j + i] = 0x3e; // '>'
    file[j + i + 1] = 0x20;

    j += i + 2;
    for (i = 0; i < timeCommited.length; i++) {
        file[j + i] = timeCommited.charCodeAt(i);
    }
    file[j + i] = 0x20;

    j += i + 1;
    for (i = 0; i < timezoneCommited.length; i++) {
        file[j + i] = timezoneCommited.charCodeAt(i);
    }
    file[j + i] = 0x0a;
    file[j + i + 1] = 0x0a;

    j += i + 2;
    for (i = 0; i < message.length; i++) {
        file[j + i] = message.charCodeAt(i);
    }

    return file;
};

})();
