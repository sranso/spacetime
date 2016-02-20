'use strict';
global.FetchPack = {};
(function () {

FetchPack.getPath = '/info/refs?service=git-upload-pack';

FetchPack.postPath = '/git-upload-pack';
FetchPack.postContentType = 'application/x-git-upload-pack-request';

var getResponseStart = GitConvert.stringToArray('001e# service=git-upload-pack\n0000');

var requiredCapabilites = ['multi_ack_detailed', 'ofs-delta', 'shallow', 'no-done'];

FetchPack.validateGetResponse = function (body) {
    var i;
    for (i = 0; i < getResponseStart.length; i++) {
        if (body[i] !== getResponseStart[i]) {
            return 'incorrect start of get response';
        }
    }

    var packetLength = GitConvert.packetLength(body, getResponseStart.length);
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

FetchPack.refsFromGetResponse = function (body) {
    if (getResponseStart.length + 4 >= body.length) {
        return [];
    }

    var firstRefStart = getResponseStart.length + 4 + 40 + 1;
    var firstRefEnd = body.indexOf(0, firstRefStart);
    var firstRefArray = body.subarray(firstRefStart, firstRefEnd);
    var firstRefName = String.fromCharCode.apply(null, firstRefArray);
    var firstHash = new Uint8Array(20);
    GitConvert.hexToHash(body, getResponseStart.length + 4, firstHash, 0);

    var refs = [[firstRefName, firstHash]];

    var j = GitConvert.packetLength(body, getResponseStart.length) + getResponseStart.length;

    while (j + 4 < body.length) {
        var packetLength = GitConvert.packetLength(body, j);
        var refArray = body.subarray(j + 4 + 40 + 1, j + packetLength - 1);
        var refName = String.fromCharCode.apply(null, refArray);
        var hash = new Uint8Array(20);
        GitConvert.hexToHash(body, j + 4, hash, 0);
        refs.push([refName, hash]);

        j = j + packetLength;
    }

    return refs;
};

var maxHaves = 10;
var capabilities = GitConvert.stringToArray('ofs-delta agent=gitmem/0.0.0');

var wantPrefix = GitConvert.stringToArray('want ');
var havePrefix = GitConvert.stringToArray('have ');
var doneLine = GitConvert.stringToArray('0009done\n');
var firstLineLength = 4 + wantPrefix.length + 40 + 2 + capabilities.length + 1;
var hexCharacters = GitConvert.stringToArray('0123456789abcdef');
var lineLength = 4 + wantPrefix.length + 40 + 1;

FetchPack.postBody = function (packIndices, store, wants, have) {
    var firstHave = have;
    var numHaves = 0;

    while (have && numHaves < maxHaves) {
        numHaves++;
        if (!have.parents) {
            CommitObject.checkoutParents(have, packIndices, store);
        }
        have = have.parents[0];
    }

    var normalLinesLength = (wants.length - 1 + numHaves) * lineLength;
    var body = new Uint8Array(firstLineLength + normalLinesLength + 4 + doneLine.length);
    body[0] = hexCharacters[firstLineLength >>> 12];
    body[1] = hexCharacters[(firstLineLength >>> 8) & 0xf];
    body[2] = hexCharacters[(firstLineLength >>> 4) & 0xf];
    body[3] = hexCharacters[firstLineLength & 0xf];

    var j = 4;
    var i;
    for (i = 0; i < wantPrefix.length; i++) {
        body[j + i] = wantPrefix[i];
    }

    j += i;
    GitConvert.hashToHex(wants[0], 0, body, j);

    j += 40;
    body[j] = 0;
    body[j + 1] = 0x20;

    j += 2;
    for (i = 0; i < capabilities.length; i++) {
        body[j + i] = capabilities[i];
    }
    body[j + i] = 0x0a;

    j += i + 1;
    var k;
    for (k = 1; k < wants.length; k++) {
        body[j] = hexCharacters[lineLength >>> 12];
        body[j + 1] = hexCharacters[(lineLength >>> 8) & 0xf];
        body[j + 2] = hexCharacters[(lineLength >>> 4) & 0xf];
        body[j + 3] = hexCharacters[lineLength & 0xf];

        j += 4;
        for (i = 0; i < wantPrefix.length; i++) {
            body[j + i] = wantPrefix[i];
        }

        j += i;
        GitConvert.hashToHex(wants[k], 0, body, j);
        body[j + 40] = 0x0a;

        j += 40 + 1;
    }

    body[j] = '0'.charCodeAt(0);
    body[j + 1] = '0'.charCodeAt(0);
    body[j + 2] = '0'.charCodeAt(0);
    body[j + 3] = '0'.charCodeAt(0);

    j += 4;
    var have = firstHave;
    for (k = 0; k < numHaves; k++) {
        body[j] = hexCharacters[lineLength >>> 12];
        body[j + 1] = hexCharacters[(lineLength >>> 8) & 0xf];
        body[j + 2] = hexCharacters[(lineLength >>> 4) & 0xf];
        body[j + 3] = hexCharacters[lineLength & 0xf];

        j += 4;
        for (i = 0; i < havePrefix.length; i++) {
            body[j + i] = havePrefix[i];
        }

        j += i;
        GitConvert.hashToHex(have.hash, have.hashOffset, body, j);
        body[j + 40] = 0x0a;

        j += 40 + 1;
        have = have.parents[0];
    }

    for (i = 0; i < doneLine.length; i++) {
        body[j + i] = doneLine[i];
    }

    return body;
};

FetchPack.packFromPostResponse = function (body) {
    var j = 0;
    while (j + 4 < body.length) {
        if (body[j] === 'P'.charCodeAt(0)) {
            return body.subarray(j);
        }
        j += GitConvert.packetLength(body, j);
    }

    return null;
};

})();
