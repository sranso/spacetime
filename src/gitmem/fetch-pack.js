'use strict';
global.FetchPack = {};
(function () {

FetchPack.getPath = '/info/refs?service=git-upload-pack';

var getResponseStart = GitFile.stringToArray('001e# service=git-upload-pack\n0000');

var requiredCapabilites = ['multi_ack_detailed', 'ofs-delta', 'shallow', 'no-done'];

FetchPack.validateGetResponse = function (body) {
    var i;
    for (i = 0; i < getResponseStart.length; i++) {
        if (body[i] !== getResponseStart[i]) {
            return 'incorrect start of get response';
        }
    }

    var packetLength = GitFile.packetLength(body, getResponseStart.length);
    var capabilitiesEnd = packetLength + getResponseStart.length - 1;
    var capabilitiesStart = body.indexOf(0, getResponseStart.length + 4 + 40 + 1) + 1;
    var capabilitiesArray = body.subarray(capabilitiesStart, capabilitiesEnd);
    var capabilitiesString = String.fromCharCode.apply(null, capabilitiesArray);
    var capabilities = capabilitiesString.split(' ');

    for (i = 0; i < requiredCapabilites.length; i++) {
        if (capabilities.indexOf(requiredCapabilites[i]) === -1) {
            return 'missing fetch-pack capability: ' + requiredCapabilites[i];
        }
    }

    return null;
};

FetchPack.parseRefsInGetResponse = function (body) {
    var firstRefStart = getResponseStart.length + 4 + 40 + 1;
    var firstRefEnd = body.indexOf(0, firstRefStart);
    var firstRefArray = body.subarray(firstRefStart, firstRefEnd);
    var firstRefName = String.fromCharCode.apply(null, firstRefArray);
    var firstHash = new Uint8Array(20);
    GitFile.hexToHash(body, getResponseStart.length, firstHash, 0);

    var refs = [[firstRefName, firstHash]];

    var j = GitFile.packetLength(body, getResponseStart.length) + getResponseStart.length;

    while (j + 4 < body.length) {
        var packetLength = GitFile.packetLength(body, j);
        var refArray = body.subarray(j + 4 + 40 + 1, j + packetLength - 1);
        var refName = String.fromCharCode.apply(null, refArray);
        var hash = new Uint8Array(20);
        GitFile.hexToHash(body, j + 4, hash, 0);
        refs.push([refName, hash]);

        j = j + packetLength;
    }

    return refs;
};

})();
