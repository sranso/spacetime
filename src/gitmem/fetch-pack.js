'use strict';
global.FetchPack = {};
(function () {

FetchPack.getPath = '/info/refs?service=git-upload-pack';

var getResponseStart = GitFile.stringToArray('001e# service=git-upload-pack\n0000');

var requiredCapabilites = ['multi_ack_detailed', 'side-band-64k', 'ofs-delta', 'shallow', 'no-progress', 'no-done'];

FetchPack.validateGetResponse = function (body) {
    var i;
    for (i = 0; i < getResponseStart.length; i++) {
        if (body[i] !== getResponseStart[i]) {
            return 'incorrect start of get response';
        }
    }

    var capabilitiesEnd = GitFile.packetLength(body, getResponseStart.length) + getResponseStart.length;
    var capabilitiesStart = body.indexOf(0, getResponseStart.length + 40);
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

})();
