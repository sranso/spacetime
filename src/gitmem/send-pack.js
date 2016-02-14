'use strict';
global.SendPack = {};
(function () {

SendPack.postPath = '/git-receive-pack';
SendPack.postContentType = 'application/x-git-receive-pack-request';

var capabilities = GitFile.stringToArray('report-status quiet agent=gitmem/0.0.0');
var firstLineConstantLength = 4 + 40 + 1 + 40 + 1 + 2 + capabilities.length + 1;
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
    body[j + i] = 0;
    body[j + i + 1] = 0x20;

    j += i + 2;
    for (i = 0; i < capabilities.length; i++) {
        body[j + i] = capabilities[i];
    }
    body[j + i] = 0x0a;

    j += i + 1;
    body[j] = '0'.charCodeAt(0);
    body[j + 1] = '0'.charCodeAt(0);
    body[j + 2] = '0'.charCodeAt(0);
    body[j + 3] = '0'.charCodeAt(0);

    j += 4;
    for (i = 0; i < pack.length; i++) {
        body[j + i] = pack[i];
    }

    return body;
};

})();
