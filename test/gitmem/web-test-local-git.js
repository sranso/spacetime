Loader.loadWeb('../..', function (event) {

var author = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    date: new Date(1454284683000),
};

var commitObject = {
    tree: Tree._actuallyEmptyTreeHash,
    parents: [],
    committer: author,
    author: author,
    message: 'Initial empty commit\n',
};

var commit = Commit.createFromObject(commitObject);
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

xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postUrl);
xhr.setRequestHeader('Content-Type', SendPack.postContentType);
console.log('pushing ' + body.length + ' bytes');
xhr.send(body);

});
