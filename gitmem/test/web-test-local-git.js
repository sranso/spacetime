'use strict';
Loader.loadWeb('../..', function () {

GitMem.initialize();

global.Thing = {};
Thing.name = 0;
Thing.initialize = function () {
    Thing.zero = $.nextIndex++;
    $[Thing.zero] = createZero({
        name: $[Constants.emptyString],
    });
};

global.Project = {};
Project.text  = 0;
Project.thing = 1;
Project.x     = 2;
Project.initialize = function () {
    Project.zero = $.nextIndex++;
    $[Project.zero] = createZero({
        text: $[Constants.emptyString],
        thing: $[Thing.zero],
        x: Constants.$positive[0],
    });
};

var initialize = function () {
    var gitmem = GitMem.create();

    Thing.initialize();
    Project.initialize();
    return gitmem;
};

var oldGitMem = initialize();
var newGitMem;

var thing = set($[Thing.zero], Thing.name, hash('name1'));

var project1 = set($[Project.zero],
                   Project.thing, thing,
                   Project.text, hash('a bit of text\n'));

var user = set($[Commit.User.zero],
                Commit.User.name, hash('Jake Sandlund'),
                Commit.User.email, hash('jake@jakesandlund.com'),
                Commit.User.timezoneOffset, hash(360));

var info = set($[Commit.Info.zero],
                Commit.Info.author, user,
                Commit.Info.committer, user);

var commit1 = commit($[Commit.zero],
                     Commit.info, info,
                     Commit.tree, project1,
                     Commit.parent, 0,
                     Commit.committerTime, hash(1463960469),
                     Commit.message, hash('Initial commit'));
var commit1Hash = $table.hashes8.slice(commit1, commit1 + 20);

var packLength = Pack.create(commit1);
var pack1 = $pack.slice(0, packLength);


var project2 = set(project1,
                   Project.x, hash(-2362.8589701),
                   Project.text, hash('different text than before\n'));

var commit2 = commit(commit1,
                     Commit.tree, project2,
                     Commit.parent, commit1,
                     Commit.committerTime, hash(1463970341),
                     Commit.message, hash('Change some stuff'));
var commit2Hash = $table.hashes8.slice(commit2, commit2 + 20);

packLength = Pack.create(commit2);
var pack2 = $pack.slice(0, packLength);


// Check packs
initialize();

Unpack.unpack(pack1);
var gotCommit1 = Table.findPointer($table, commit1Hash, 0);
console.log('[checkPack] commit1 hash: ' + hexHash($table.hashes8, gotCommit1));

Unpack.unpack(pack2);
var gotCommit2 = Table.findPointer($table, commit2Hash, 0);
console.log('[checkPack] commit2 hash: ' + hexHash($table.hashes8, gotCommit2));

GitMem.load(oldGitMem);


var ajax = function (callback) {
    var xhr = new XMLHttpRequest();
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
    xhr.responseType = 'arraybuffer';
    return xhr;
};

var push = function (previous, current, packLength, callback) {
    var body = SendPack.postBody('refs/heads/test-branch', previous, current, packLength);

    var xhr = ajax(function (response) {
        console.log('[push] received ' + response.length + ' bytes');
        console.log(pretty(response));
        callback(response);
    });

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    console.log('[push] post ' + body.length + ' bytes');
    xhr.send(body);
};

var fetchGet = function (callback) {
    var xhr = ajax(function (response) {
        console.log('[fetchGet] received ' + response.length + ' bytes');
        console.log(pretty(response));
        var errorMessage = FetchPack.validateGetResponse(response);
        if (errorMessage) {
            console.log(errorMessage);
            return;
        }
        var refs = FetchPack.refsFromGetResponse(response);
        callback(refs);
    });

    xhr.open('GET', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.getPath);
    console.log('[fetchGet] get refs');
    xhr.send();
};

var fetchPost = function (atCommit, refs, callback) {
    if (!refs.length) {
        throw new Error('Expected refs for fetch');
    }

    var refPointer;
    var i;
    for (i = 0; i < refs.length; i++) {
        if (refs[i][0] === 'refs/heads/test-branch') {
            refPointer = refs[i][1];
        }
    }
    if (!refPointer) {
        throw new Error('refs/heads/test-branch not found in refs');
    }
    console.log('[fetchPost] fetching commit', hexHash($table.hashes8, refPointer));

    var xhr = ajax(function (response) {
        var pack = FetchPack.packFromPostResponse(response);
        if (!pack) {
            throw new Error('[fetchPost] pack not received');
        }
        callback(refPointer, pack);
    });

    var body = FetchPack.postBody(refPointer, atCommit);

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.postPath);
    xhr.setRequestHeader('Content-Type', FetchPack.postContentType);
    console.log('[fetchPost] post ' + body.length + ' bytes');
    xhr.send(body);
};


var initGet = function () {
    console.log('[initGet] get');
    fetchGet(function (refs) {
        if (refs.length) {
            initDelete(refs);
        } else {
            firstPush();
        }
    });
};

var initDelete = function (refs) {
    var refPointer;
    var i;
    for (i = 0; i < refs.length; i++) {
        if (refs[i][0] === 'refs/heads/test-branch') {
            refPointer = refs[i][1];
        }
    }
    if (!refPointer) {
        throw new Error('refs/heads/test-branch not found in refs');
    }

    console.log('[initDelete] delete');
    push(refPointer, $[Constants.zeroHash], 0, firstPush);
};

var firstPush = function () {
    console.log('[firstPush] pushing commit with hash', hexHash($table.hashes8, commit1));

    console.log('[firstPush] pushing pack with hash', hexHash(pack1, pack1.length - 20));

    global.$pack = pack1;
    push($[Constants.zeroHash], commit1, pack1.length, function () {
        fetchGet(function (refs) {
            fetchPost(0, refs, afterClone);
        });
    });
};

var afterClone = function (refPointer, pack) {
    var commitHash = $table.hashes8.slice(refPointer, refPointer + 20);
    console.log(hexHash(commitHash, 0));
    newGitMem = initialize();

    Unpack.unpack(pack);

    var gotCommit = Table.findPointer($table, commitHash, 0);
    console.log('[afterClone] commit hash: ' + hexHash($table.hashes8, gotCommit));
    console.log('[afterClone] commit message: ' + val(get(gotCommit, Commit.message)));
    console.log('[afterClone] commit time: ' + new Date(1000 * val(get(gotCommit, Commit.committerTime))));

    var project = get(gotCommit, Commit.tree);
    console.log('[afterClone] project text:', val(get(project, Project.text)));
    console.log('[afterClone] project x:', val(get(project, Project.x)));
    var thing = get(project, Project.thing);
    console.log('[afterClone] thing name:', val(get(thing, Thing.name)));

    GitMem.load(oldGitMem);

    console.log('[afterClone] pushing commit with hash', hexHash($table.hashes8, commit2));

    console.log('[afterClone] pushing pack with hash', hexHash(pack2, pack2.length - 20));

    global.$pack = pack2;
    push(commit1, commit2, pack2.length, function () {
        fetchGet(function (refs) {
            fetchPost(commit1, refs, afterFetch);
        });
    });
};

var afterFetch = function (refPointer, pack) {
    var commitHash = $table.hashes8.slice(refPointer, refPointer + 20);
    GitMem.load(newGitMem);

    Unpack.unpack(pack);

    var gotCommit = Table.findPointer($table, commitHash, 0);
    console.log('[afterFetch] commit hash: ' + hexHash($table.hashes8, gotCommit));
    console.log('[afterFetch] commit message: ' + val(get(gotCommit, Commit.message)));
    console.log('[afterFetch] commit time: ' + new Date(1000 * val(get(gotCommit, Commit.committerTime))));

    var project = get(gotCommit, Commit.tree);
    console.log('[afterFetch] project text:', val(get(project, Project.text)));
    console.log('[afterFetch] project x:', val(get(project, Project.x)));
    var thing = get(project, Project.thing);
    console.log('[afterFetch] thing name:', val(get(thing, Thing.name)));

    var commitParent = get(gotCommit, Commit.parent);
    console.log('[afterFetch] parent commit hash: ' + hexHash($table.hashes8, commitParent));
    console.log('[afterFetch] parent commit message: ' + val(get(commitParent, Commit.message)));
};

initGet();

});
