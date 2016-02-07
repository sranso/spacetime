'use strict';
global.CommitFile = {};
(function () {

var commitPrefix = GitFile.stringToArray('commit ');
var treePrefix = GitFile.stringToArray('tree ');
var parentPrefix = GitFile.stringToArray('\nparent ');
var authorPrefix = GitFile.stringToArray('\nauthor ');
var committerPrefix = GitFile.stringToArray('\ncommitter ');

CommitFile.catFile = function (file) {
    var type = String.fromCharCode.apply(null, file.subarray(0, file.indexOf(0x20, 4)));

    if (type !== 'commit') {
        throw new Error('Unexpected type: ' + type);
    }

    var j = file.indexOf(0, 8) + 1;
    var rest = file.subarray(j);
    return String.fromCharCode.apply(null, rest);
};

var constantLength = 'tree \nauthor  <> \ncommitter  <> \n\n'.length;
constantLength += 40;
var perParentLength = parentPrefix.length + 40;

CommitFile.createFromObject = function (commit) {
    var authorName = commit.author.name; // TODO: make this safe
    var authorEmail = commit.author.email;
    var dateAuthored = gitDate(commit.author.date);

    var committerName = commit.committer.name; // TODO: make this safe
    var committerEmail = commit.committer.email;
    var dateCommited = gitDate(commit.committer.date);

    var message = commit.message;

    var length = constantLength;
    length += commit.parents.length * perParentLength;
    length += authorName.length + authorEmail.length + dateAuthored.length;
    length += committerName.length + committerEmail.length + dateCommited.length;
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

    j += i + 1;
    for (i = 0; i < treePrefix.length; i++) {
        file[j + i] = treePrefix[i];
    }

    j += i;
    GitFile.hashToHex(commit.tree, 0, file, j);

    var p, parentCommit;
    for (p = 0; p < commit.parents.length; p++) {
        j += 40;
        for (i = 0; i < parentPrefix.length; i++) {
            file[j + i] = parentPrefix[i];
        }

        j += i;
        GitFile.hashToHex(commit.parents[p], 0, file, j);
    }

    // author
    j += 40;
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
    for (i = 0; i < dateAuthored.length; i++) {
        file[j + i] = dateAuthored.charCodeAt(i);
    }

    // committer
    j += i;
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
    for (i = 0; i < dateCommited.length; i++) {
        file[j + i] = dateCommited.charCodeAt(i);
    }
    file[j + i] = 0x0a;
    file[j + i + 1] = 0x0a;

    j += i + 2;
    for (i = 0; i < message.length; i++) {
        file[j + i] = message.charCodeAt(i);
    }

    return file;
};

var gitDate = function (date) {
    var tzOffset = -date.getTimezoneOffset();
    var absOffset = Math.abs(tzOffset);
    var tzHours = Math.floor(absOffset / 60);
    var tzMinutes = absOffset - 60 * tzHours;
    var sign = tzOffset >= 0 ? '+' : '-';
    var hours = tzHours > 9 ? tzHours : '0' + tzHours;
    var minutes = tzMinutes > 9 ? tzMinutes : '0' + tzMinutes;
    var seconds = Math.floor(+date / 1000);
    return seconds + ' ' + sign + hours + minutes;
};

})();
