'use strict';
global.SendPack = {};
(function () {

var capabilities = GitFile.stringToArray(' report-status side-band-64k agent=gitmem/0.0.0');
var firstLineConstantLength = 4 + 40 + 1 + 40 + 1 + 1 + capabilities.length;
var hexCharacters = GitFile.stringToArray('0123456789abcdef');

SendPack.postBody = function (branch, previousHash, currentHash, pack) {
    var firstLineLength = firstLineConstantLength + branch.length;

    var body = new Uint8Array(firstLineLength + 4 + pack.length);
    body[0] = hexCharacters[firstLineLength >>> 12];
    body[1] = hexCharacters[(firstLineLength >>> 8) & 0xf];
    body[2] = hexCharacters[(firstLineLength >>> 4) & 0xf];
    body[3] = hexCharacters[firstLineLength & 0xf];

    var j = 4;
    var i;
    GitFile.hashToHex(previousHash, 0, body, j);

    j += 40;
    body[j] = 0x20;

    j += 1;
    GitFile.hashToHex(currentHash, 0, body, j);

    j += 40;
    body[j] = 0x20;

    j += 1;
    for (i = 0; i < branch.length; i++) {
        body[j + i] = branch.charCodeAt(i);
    }

    j += i + 1;
    for (i = 0; i < capabilities.length; i++) {
        body[j + i] = capabilities[i];
    }

    j += i;
    body[j] = 0x30; // '0'
    body[j + 1] = 0x30; // '0'
    body[j + 2] = 0x30; // '0'
    body[j + 3] = 0x30; // '0'

    j += 4;
    for (i = 0; i < pack.length; i++) {
        body[j + i] = pack[i];
    }
    return body;
};

SendPack.postUrl = '/git-receive-pack';
SendPack.postContentType = 'application/x-git-receive-pack-request';

})();
