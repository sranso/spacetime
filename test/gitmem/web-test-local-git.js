'use strict';
Loader.loadWeb('../..', function (event) {

var random = Random.create(9699637);
var loadHashTable = HashTable.create(random);

global.Thing = {};

Thing.clone = function (original) {
    return {
        name: original.name,
        file: original.file.slice(),
        hash: null,
        hashOffset: 0,
    };
};

Thing.none = Thing.clone({
    name: '',
    file: new Uint8Array(0),
    hash: new Uint8Array(20),
    hashOffset: 0,
});

Thing.offsets = {};

Thing.none.file = Tree.createSkeleton(Thing.offsets, {
    name: 'blob',
});

// Normally we would need to store the Thing.none properties
// like so, but all the properties are overridden later.
// BaseTreeObject.set(Thing.none, 'name', Thing.none.name, Thing.offsets.name, 'string');
// Thing.none.hash = new Uint8Array(20);
// Sha1.hash(Thing.none.file, Thing.none.hash, 0);
// HashTable.save($HashTable, Thing.none);

Thing.checkout = function (packIndices, table, hash, hashOffset) {
    var thing = HashTable.get(table, hash, hashOffset);
    if (thing) {
        return thing;
    }

    var file = PackIndex.lookupFileMultiple(packIndices, hash, hashOffset);

    thing = Thing.clone(Thing.none);
    thing.file = file;
    thing.hash = hash;
    thing.hashOffset = hashOffset;
    HashTable.save(table, thing);

    thing.name = Value.checkoutString(packIndices, table, file, Thing.offsets.name);

    return thing;
};

var oldProject = Project;

global.Project = {};

Project.clone = function (original) {
    return {
        thing: original.thing,
        text: original.text,
        xPosition: original.xPosition,
        hasStuff: original.hasStuff,
        file: original.file.slice(),
        hash: null,
        hashOffset: 0,
    };
};

Project.none = Project.clone({
    thing: Thing.none,
    text: '',
    xPosition: 0,
    hasStuff: false,
    file: new Uint8Array(0),
    hash: new Uint8Array(20),
    hashOffset: 0,
});

Project.offsets = {};

Project.none.file = Tree.createSkeleton(Project.offsets, {
    hasStuff: 'blob',
    thing: 'tree',
    text: 'blob',
    xPosition: 'blob',
});

Project.checkout = function (packIndices, table, hash, hashOffset) {
    var project = HashTable.get(table, hash, hashOffset);
    if (project) {
        return project;
    }

    var packs = packIndices;
    var file = PackIndex.lookupFileMultiple(packs, hash, hashOffset);

    var ofs = Project.offsets;
    project = Project.clone(Project.none);
    project.file = file;
    project.hash = hash;
    project.hashOffset = hashOffset;
    HashTable.save(table, project);

    project.thing = Thing.checkout(packs, table, file, ofs.thing);
    project.text = Value.checkoutString(packs, table, file, ofs.text);
    project.xPosition = Value.checkoutNumber(packs, table, file, ofs.xPosition);
    project.hasStuff = Value.checkoutBoolean(packs, table, file, ofs.hasStuff);

    return project;
};











var initGet = function () {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        if (this.status !== 200) {
            throw new Error(this.statusText);
        }
        var response = new Uint8Array(this.response);
        console.log('[initGet] get received ' + response.length + ' bytes');
        console.log(pretty(response));
        var refs = FetchPack.refsFromGetResponse(response);
        if (refs.length) {
            initDelete(refs);
        } else {
            firstPush();
        }
    });
    xhr.addEventListener('error', function (e) {
        throw new Error('connection level error');
    });
    xhr.responseType = 'arraybuffer';

    // TODO: make this use SendPack.getPath
    xhr.open('GET', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.getPath);
    console.log('[initGet] get');
    xhr.send();
};

var initDelete = function (refs) {
    var refHash;
    var i;
    for (i = 0; i < refs.length; i++) {
        if (refs[i][0] === 'refs/heads/test-branch') {
            refHash = refs[i][1];
        }
    }
    if (!refHash) {
        throw new Error('refs/heads/test-branch not found in refs');
    }

    push(refHash, SendPack.zeroHash, SendPack.nonePack, firstPush);
};

var push = function (previousHash, currentHash, pack, callback) {
    var branch = 'refs/heads/test-branch';

    var body = SendPack.postBody(branch, previousHash, currentHash, pack);

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        if (this.status !== 200) {
            throw new Error(this.statusText);
        }
        console.log('[push] received ' + this.responseText.length + ' bytes');
        console.log(this.responseText);
        callback();
    });
    xhr.addEventListener('error', function (e) {
        throw new Error('connection level error');
    });

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    console.log('[push] post ' + body.length + ' bytes');
    xhr.send(body);
};

var firstPush = function () {
    var project = Project.clone(Project.none);

    var thing = Thing.clone(Thing.none);
    thing.name = 'name1';
    var nameBlob = Value.blobFromString(thing.name);
    Sha1.hash(nameBlob, thing.file, Thing.offsets.name);

    thing.hash = project.file;
    thing.hashOffset = Project.offsets.thing;
    Sha1.hash(thing.file, thing.hash, thing.hashOffset);

    project.thing = thing;
    project.text = (
        'a bit of text\n' +
        'that hopefully\n' +
        'causes\n' +
        'some delta compresssion\n' +
        'when we change project.text below\n'
    );
    var textBlob = Value.blobFromString(project.text);
    Sha1.hash(textBlob, project.file, Project.offsets.text);

    project.xPosition = 0;
    var positionBlob = Value.blobFromNumber(project.xPosition);
    Sha1.hash(positionBlob, project.file, Project.offsets.xPosition);

    project.hasStuff = false;
    var hasStuffBlob = Value.blobFromBoolean(project.hasStuff);
    Sha1.hash(hasStuffBlob, project.file, Project.offsets.hasStuff);

    project.hash = new Uint8Array(20);
    Sha1.hash(project.file, project.hash, 0);

    var commit = CommitObject.clone(CommitObject.none);
    commit.author = commit.committer = {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        time: 1454284683000,
        timezoneOffset: 360,
    };
    commit.message = 'Initial commit with first values\n';
    commit.tree = project;
    commit.parents = [];

    commit.file = CommitFile.createFromObject(commit);
    commit.hash = new Uint8Array(20);
    Sha1.hash(commit.file, commit.hash, 0);
    console.log('[firstPush] created commit with hash', hex(commit.hash));

    var files = [
        commit.file,
        project.file,
        thing.file,
        nameBlob,
        textBlob,
        positionBlob,
        hasStuffBlob,
    ];

    var pack = Pack.create(files);
    console.log('[firstPush] created pack with hash', hex(pack.subarray(pack.length - 20)));

    push(SendPack.zeroHash, commit.hash, pack, function () {
        var atCommit = null;
        fetchGet(atCommit, afterClone);
    });
};

var fetchGet = function (atCommit, callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        if (this.status !== 200) {
            throw new Error(this.statusText);
        }
        var response = new Uint8Array(this.response);
        console.log('[fetchGet] received ' + response.length + ' bytes');
        console.log(pretty(response));
        var errorMessage = FetchPack.validateGetResponse(response);
        if (errorMessage) {
            console.log(errorMessage);
            return;
        }
        var refs = FetchPack.refsFromGetResponse(response);
        fetchPost(atCommit, refs, callback);
    });
    xhr.addEventListener('error', function (e) {
        throw new Error('connection level error');
    });
    xhr.responseType = 'arraybuffer';

    xhr.open('GET', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.getPath);
    console.log('[fetchGet] get');
    xhr.send();
};

var fetchPost = function (atCommit, refs, callback) {
    if (!refs.length) {
        throw new Error('Expected refs for fetch');
    }

    var refHash;
    var i;
    for (i = 0; i < refs.length; i++) {
        if (refs[i][0] === 'refs/heads/test-branch') {
            refHash = refs[i][1];
        }
    }
    if (!refHash) {
        throw new Error('refs/heads/test-branch not found in refs');
    }
    console.log('[fetchPost] fetching commit', hex(refHash));

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        if (this.status !== 200) {
            throw new Error(this.statusText);
        }
        var response = new Uint8Array(this.response);
        console.log('[fetchPost] received ' + response.length + ' bytes');
        var pack = FetchPack.packFromPostResponse(response);
        if (!pack) {
            throw new Error('[fetchPost] pack not received');
        }
        callback(refHash, pack);
    });
    xhr.addEventListener('error', function (e) {
        throw new Error('connection level error');
    });
    xhr.responseType = 'arraybuffer';

    var body = FetchPack.postBody([], null, [refHash], atCommit);

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.postPath);
    xhr.setRequestHeader('Content-Type', FetchPack.postContentType);
    console.log('[fetchPost] post ' + body.length + ' bytes');
    xhr.send(body);
};

var afterClone = function (refHash, pack) {
    var index = PackIndex.create(pack);
    var commit = CommitObject.checkout([index], loadHashTable, refHash, 0);
    console.log('[afterClone] commit message: ' + commit.message);
    console.log('[afterClone] commit time: ' + new Date(commit.committer.time));

    CommitObject.checkoutTree(commit, [index], loadHashTable);

    console.log('[afterClone] loaded tree:', hex(commit.tree.hash));
    console.log('[afterClone] project text:', commit.tree.text.slice(0, 12) + '...');
    console.log('[afterClone] project x:', commit.tree.xPosition);
    console.log('[afterClone] project hasStuff:', commit.tree.hasStuff);
    console.log('[afterClone] thing hashOffset:', commit.tree.thing.hashOffset);
    console.log('[afterClone] thing name type:', typeof commit.tree.thing.name);

    var project = Project.clone(commit.tree);

    var thing = Thing.clone(commit.tree.thing);
    thing.name = 'thingname';
    var nameBlob = Value.blobFromString(thing.name);
    Sha1.hash(nameBlob, thing.file, Thing.offsets.name);

    thing.hash = project.file;
    thing.hashOffset = Project.offsets.thing;
    Sha1.hash(thing.file, thing.hash, thing.hashOffset);

    project.thing = thing;
    project.text = (
        'a bit of text\n' +
        'that hopefully\n' +
        'causes\n' +
        'Nay, caused!\n' +
        'some delta compresssion\n' +
        'when we change project.text below\n'
    );
    var textBlob = Value.blobFromString(project.text);
    Sha1.hash(textBlob, project.file, Project.offsets.text);

    project.xPosition = -2362.8589701;
    var positionBlob = Value.blobFromNumber(project.xPosition);
    Sha1.hash(positionBlob, project.file, Project.offsets.xPosition);

    project.hasStuff = true;
    var hasStuffBlob = Value.blobFromBoolean(project.hasStuff);
    Sha1.hash(hasStuffBlob, project.file, Project.offsets.hasStuff);

    project.hash = new Uint8Array(20);
    Sha1.hash(project.file, project.hash, 0);

    var commit2 = CommitObject.clone(CommitObject.none);
    commit2.author = commit2.committer = {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        time: 1455501462000,
        timezoneOffset: 360,
    };
    commit2.message = 'Commit with values filled in\n';
    commit2.tree = project;
    commit2.parents = [commit];

    commit2.file = CommitFile.createFromObject(commit2);
    commit2.hash = new Uint8Array(20);
    Sha1.hash(commit2.file, commit2.hash, 0);
    console.log('[afterClone] created commit2 with hash', hex(commit2.hash));

    var files = [
        commit2.file,
        project.file,
        thing.file,
        nameBlob,
        textBlob,
        positionBlob,
        hasStuffBlob,
    ];

    var pack = Pack.create(files);
    console.log('[afterClone] created pack with hash', hex(pack.subarray(pack.length - 20)));

    push(commit.hash, commit2.hash, pack, function () {
        fetchGet(commit, afterFetch);
    });
};

var afterFetch = function (refHash, pack) {
    var index = PackIndex.create(pack);
    var commit = CommitObject.checkout([index], loadHashTable, refHash, 0);
    console.log('[afterFetch] commit message: ' + commit.message);
    console.log('[afterFetch] commit time: ' + new Date(commit.committer.time));

    CommitObject.checkoutTree(commit, [index], loadHashTable);

    console.log('[afterFetch] loaded tree:', hex(commit.tree.hash));
    console.log('[afterFetch] project text:', commit.tree.text.slice(0, 12) + '...');
    console.log('[afterFetch] project x:', commit.tree.xPosition);
    console.log('[afterFetch] project hasStuff:', commit.tree.hasStuff);
    console.log('[afterFetch] thing hashOffset:', commit.tree.thing.hashOffset);
    console.log('[afterFetch] thing name:', commit.tree.thing.name);

    CommitObject.checkoutParents(commit, [index], loadHashTable);
    var parentCommit = commit.parents[0];
    console.log('[afterFetch] commit parent hash:', hex(parentCommit.hash));
    console.log('[afterFetch] commit parent message:', parentCommit.message);
    console.log('[afterFetch] parent project text:', parentCommit.tree.text.slice(0, 12) + '...');

    fetchGet(null, lastClone);
};

var lastClone = function (refHash, pack) {
    var index = PackIndex.create(pack);
    var random = Random.create(868869);
    var table = HashTable.create(random);
    var commit = CommitObject.checkout([index], table, refHash, 0);
    console.log('[lastClone] commit message: ' + commit.message);
    console.log('[lastClone] commit time: ' + new Date(commit.committer.time));

    CommitObject.checkoutTree(commit, [index], table);

    console.log('[lastClone] loaded tree:', hex(commit.tree.hash));
    console.log('[lastClone] project text:', commit.tree.text.slice(0, 12) + '...');
    console.log('[lastClone] thing name:', commit.tree.thing.name);

    CommitObject.checkoutParents(commit, [index], table);
    var parentCommit = commit.parents[0];
    console.log('[lastClone] commit parent hash:', hex(commit1.hash));
    console.log('[lastClone] commit parent message:', commit1.message);

    CommitObject.checkoutTree(parentCommit, [index], table);

    console.log('[lastClone] parent project text:', parentCommit.tree.text.slice(0, 12) + '...');
    console.log('[lastClone] parent thing name:', parentCommit.tree.thing.name);
};

initGet();

});
