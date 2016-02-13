Loader.loadWeb('../..', function (event) {

var push = function () {
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
        console.log(this.statusText);
    });

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    console.log('pushing ' + body.length + ' bytes');
    xhr.send(body);
};

var fetch = function () {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
    });
    xhr.addEventListener('error', function () {
        console.log(this.statusText);
    });

    xhr.open('GET', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.getPath);
    xhr.send();
};

// push();
fetch();

});
