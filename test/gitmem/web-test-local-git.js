Loader.loadWeb('../..', function (event) {

var pushFirst = function () {
    var author = {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        time: 1454284683000,
        timezoneOffset: 360,
    };

    var commitObject = {
        tree: {hash: Tree._actuallyEmptyTreeHash, hashOffset: 0},
        parents: [],
        committer: author,
        author: author,
        message: 'Initial empty commit\n',
    };

    var commit = CommitFile.createFromObject(commitObject);
    var commitHash = new Uint8Array(20);
    Sha1.hash(commit, commitHash, 0);

    var previousHash = new Uint8Array(20);

    var branch = 'refs/heads/master';

    var pack = Pack.create([commit, Tree._actuallyEmptyTree]);

    var body = SendPack.postBody(branch, previousHash, commitHash, pack);

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    console.log('[push] post ' + body.length + ' bytes');
    xhr.send(body);
};

var cloneGet = function () {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        var response = new Uint8Array(this.response);
        console.log('[clone] get received ' + response.length + ' bytes');
        console.log(pretty(response));
        var refs = FetchPack.refsFromGetResponse(response);
        if (refs.length) {
            clonePost(refs);
        } else {
            pushFirst();
        }
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });
    xhr.responseType = 'arraybuffer';

    xhr.open('GET', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.getPath);
    console.log('[clone] get');
    xhr.send();
};

var clonePost = function (refs) {
    var refHash;
    var i;
    for (i = 0; i < refs.length; i++) {
        if (refs[i][0] === 'refs/heads/master') {
            refHash = refs[i][1];
        }
    }
    if (!refHash) {
        throw new Error('refs/heads/master not found in refs');
    }

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        var response = new Uint8Array(this.response);
        console.log('[clone] post received ' + response.length + ' bytes');
        console.log(pretty(response));
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });
    xhr.responseType = 'arraybuffer';

    var body = FetchPack.postBody([], null, [refHash], null);

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.postPath);
    xhr.setRequestHeader('Content-Type', FetchPack.postContentType);
    console.log('[clone] post ' + body.length + ' bytes');
    xhr.send(body);
};

var fetch = function () {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });

    xhr.open('GET', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.getPath);
    xhr.send();
};

// fetch();
cloneGet();

});
