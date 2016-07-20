'use strict';
global.Remote = {};
(function () {

var ajax = function (callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';

    xhr.addEventListener('load', function () {
        if (this.status !== 200) {
            throw new Error(this.statusText);
        }
        var response = new Uint8Array(this.response);
        callback(response);
    });

    xhr.addEventListener('error', function (e) {
        throw new Error('connection level error');
    });

    return xhr;
};

Remote.queryRef = function (gitUrl, refName, callback) {
    var xhr = ajax(function (response) {
        console.log('[Remote.queryRef] received ' + response.length + ' bytes');
        console.log(pretty(response));
        var errorMessage = FetchPack.validateGetResponse(response);
        if (errorMessage) {
            console.log(errorMessage);
            return;
        }

        var refs = FetchPack.refsFromGetResponse(response);
        var i;
        for (i = 0; i < refs.length; i++) {
            if (refs[i][0] === refName) {
                var ref = refs[i][1];
                return callback(ref);
            }
        }

        return callback($[Constants.zeroHash]);
    });

    console.log('[Remote.queryRef] GET');

    xhr.open('GET', gitUrl + FetchPack.getPath);
    xhr.send();
};

Remote.fetch = function (gitUrl, remoteCommit, atCommit, callback) {
    var body = FetchPack.postBody(remoteCommit, atCommit);

    var xhr = ajax(function (response) {
        var pack = FetchPack.packFromPostResponse(response);
        if (!pack) {
            console.log('[Remote.fetch] pack not received');
            return;
        }
        console.log('[Remote.fetch] received ' + response.length + ' bytes');

        Unpack.unpack(pack);

        callback(remoteCommit);
    });

    console.log('[Remote.fetch] POST ' + body.length + ' bytes');

    xhr.open('POST', gitUrl + FetchPack.postPath);
    xhr.setRequestHeader('Content-Type', FetchPack.postContentType);
    xhr.send(body);
};

Remote.push = function (gitUrl, refName, previous, current, packLength, callback) {
    var body = SendPack.postBody(refName, previous, current, packLength);

    var xhr = ajax(function (response) {
        console.log('[Remote.push] received ' + response.length + ' bytes');
        console.log(pretty(response));
        callback(response);
    });

    console.log('[Remote.push] POST ' + body.length + ' bytes');

    xhr.open('POST', gitUrl + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    xhr.send(body);
};

})();
