'use strict';
global.FetchPack = {};
(function () {

FetchPack.getPath = '/info/refs?service=git-upload-pack';

FetchPack.postPath = '/git-upload-pack';
FetchPack.postContentType = 'application/x-git-upload-pack-request';

var getResponseStart = Convert.stringToArray('001e# service=git-upload-pack\n0000');

FetchPack.validateGetResponse = function (body) {
    var i;
    for (i = 0; i < getResponseStart.length; i++) {
        if (body[i] !== getResponseStart[i]) {
            return 'Incorrect start of get response';
        }
    }

    return null;
};

FetchPack.validateCapabilities = function (body, requiredCapabilites) {
    var lineLength = Convert.pktLineToLength(body, getResponseStart.length);
    var capabilitiesEnd = lineLength + getResponseStart.length - 1;
    var capabilitiesStart = body.indexOf(0, getResponseStart.length + 4 + 40 + 1) + 1;
    var capabilitiesArray = body.subarray(capabilitiesStart, capabilitiesEnd);
    var capabilitiesString = String.fromCharCode.apply(null, capabilitiesArray);
    var capabilities = capabilitiesString.split(' ');

    var i;
    for (i = 0; i < requiredCapabilites.length; i++) {
        if (capabilities.indexOf(requiredCapabilites[i]) === -1) {
            return 'Missing fetch-pack capability: ' + requiredCapabilites[i];
        }
    }

    return null;
};

var tempHash = new Uint8Array(20);

FetchPack.refsFromGetResponse = function (body) {
    if (getResponseStart.length + 4 >= body.length) {
        return [];
    }

    var firstRefStart = getResponseStart.length + 4 + 40 + 1;
    var firstRefEnd = body.indexOf(0, firstRefStart);
    var firstRefArray = body.subarray(firstRefStart, firstRefEnd);
    var firstRefName = String.fromCharCode.apply(null, firstRefArray);
    Convert.hexToHash(body, getResponseStart.length + 4, tempHash, 0);
    var refPointer = Table.findPointer($table, tempHash, 0);
    if (refPointer < 0) {
        refPointer = ~refPointer;
        Table.setHash($table, refPointer, tempHash, 0);
        $table.data8[Table.typeOffset(refPointer)] = Type.pending;
    }


    var refs = [[firstRefName, refPointer]];

    var j = Convert.pktLineToLength(body, getResponseStart.length) + getResponseStart.length;

    while (j + 4 < body.length) {
        var lineLength = Convert.pktLineToLength(body, j);
        var refArray = body.subarray(j + 4 + 40 + 1, j + lineLength - 1);
        var refName = String.fromCharCode.apply(null, refArray);
        Convert.hexToHash(body, j + 4, tempHash, 0);
        refPointer = Table.findPointer($table, tempHash, 0);
        if (refPointer < 0) {
            refPointer = ~refPointer;
            Table.setHash($table, refPointer, tempHash, 0);
            $table.data8[Table.typeOffset(refPointer)] = Type.pending;
        }
        refs.push([refName, refPointer]);

        j = j + lineLength;
    }

    return refs;
};

var maxHaves = 10;
var capabilities = Convert.stringToArray('thin-pack agent=gitmem/0.0.0');

var wantPrefix = Convert.stringToArray('want ');
var havePrefix = Convert.stringToArray('have ');
var doneLine = Convert.stringToArray('0009done\n');
var wantLineLength = 4 + wantPrefix.length + 40 + 1;
var firstLineLength = wantLineLength + 2 + capabilities.length;
var hexCharacters = Convert.stringToArray('0123456789abcdef');

FetchPack.postBody = function (want, have) {
    var firstHave = have;
    var numHaves = 0;
    if (have !== $[Constants.zeroHash]) {
        while (have && numHaves < maxHaves) {
            numHaves++;
            have = $table.data32[(have >> 2) + Commit.parent];
        }
    }

    var normalLinesLength = numHaves * wantLineLength;
    var body = new Uint8Array(firstLineLength + normalLinesLength + 4 + doneLine.length);
    body[0] = hexCharacters[(firstLineLength >>> 12)      ];
    body[1] = hexCharacters[(firstLineLength >>>  8) & 0xf];
    body[2] = hexCharacters[(firstLineLength >>>  4) & 0xf];
    body[3] = hexCharacters[(firstLineLength       ) & 0xf];

    var j = 4;
    var i;
    for (i = 0; i < wantPrefix.length; i++) {
        body[j + i] = wantPrefix[i];
    }

    j += i;
    Convert.hashToHex($table.hashes8, want, body, j);

    j += 40;
    body[j] = 0;
    body[j + 1] = 0x20;

    j += 2;
    for (i = 0; i < capabilities.length; i++) {
        body[j + i] = capabilities[i];
    }
    body[j + i] = 0x0a;

    j += i + 1;

    body[j]     = '0'.charCodeAt(0);
    body[j + 1] = '0'.charCodeAt(0);
    body[j + 2] = '0'.charCodeAt(0);
    body[j + 3] = '0'.charCodeAt(0);

    j += 4;
    var have = firstHave;
    var k;
    for (k = 0; k < numHaves; k++) {
        body[j]     = hexCharacters[(wantLineLength >>> 12)      ];
        body[j + 1] = hexCharacters[(wantLineLength >>>  8) & 0xf];
        body[j + 2] = hexCharacters[(wantLineLength >>>  4) & 0xf];
        body[j + 3] = hexCharacters[(wantLineLength       ) & 0xf];

        j += 4;
        for (i = 0; i < havePrefix.length; i++) {
            body[j + i] = havePrefix[i];
        }

        j += i;
        Convert.hashToHex($table.hashes8, have, body, j);
        body[j + 40] = 0x0a;

        j += 40 + 1;
        have = $table.data32[(have >> 2) + Commit.parent];
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
        j += Convert.pktLineToLength(body, j);
    }

    return null;
};

})();
