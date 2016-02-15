Loader.loadWeb('../..', function (event) {

var firstPushStore = Global.store = Store.create();

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

BaseTreeObject.set(Thing.none, 'name', Thing.none.name, Thing.offsets.name, 'string');
Thing.none.hash = new Uint8Array(20);
Sha1.hash(Thing.none.file, Thing.none.hash, 0);
Store.save(firstPushStore, Thing.none);

Thing.checkout = function (packIndices, store, hash, hashOffset) {
    var thing = Store.get(store, hash, hashOffset);
    if (thing) {
        return thing;
    }

    var file = PackIndex.lookupFileMultiple(packIndices, hash, hashOffset);

    thing = Thing.clone(Thing.none);
    thing.name = Value.checkoutString(packIndices, store, file, Thing.offsets.name);
    thing.file = file;
    thing.hash = hash;
    thing.hashOffset = hashOffset;

    return Store.save(store, thing);
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

BaseTreeObject.set(Project.none, 'thing', Project.none.thing, Project.offsets.thing, 'object');
BaseTreeObject.set(Project.none, 'text', Project.none.text, Project.offsets.text, 'string');
BaseTreeObject.set(Project.none, 'xPosition', Project.none.xPosition, Project.offsets.xPosition, 'number');
BaseTreeObject.set(Project.none, 'hasStuff', Project.none.hasStuff, Project.offsets.hasStuff, 'boolean');
Project.none.hash = new Uint8Array(20);
Sha1.hash(Project.none.file, Project.none.hash, 0);
Store.save(firstPushStore, Project.none);

Project.checkout = function (packIndices, store, hash, hashOffset) {
    var project = Store.get(store, hash, hashOffset);
    if (project) {
        return project;
    }

    var packs = packIndices;
    var file = PackIndex.lookupFileMultiple(packs, hash, hashOffset);

    var ofs = Project.offsets;
    project = Project.clone(Project.none);
    project.thing = Thing.checkout(packs, store, file, ofs.thing);
    project.text = Value.checkoutString(packs, store, file, ofs.text);
    project.xPosition = Value.checkoutNumber(packs, store, file, ofs.xPosition);
    project.hasStuff = Value.checkoutBoolean(packs, store, file, ofs.hasStuff);
    project.file = file;
    project.hash = hash;
    project.hashOffset = hashOffset;

    return Store.save(store, project);
};











var initGet = function () {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
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
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
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

    var body = SendPack.postBody('refs/heads/test-branch', refHash, SendPack.zeroHash, SendPack.nonePack);

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
        firstPush();
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    console.log('[initDelete] post ' + body.length + ' bytes');
    xhr.send(body);
};

var firstPush = function () {
    var commit = CommitObject.clone(CommitObject.none);
    commit.author = commit.committer = {
        name: 'Jake Sandlund',
        email: 'jake@jakesandlund.com',
        time: 1454284683000,
        timezoneOffset: 360,
    };
    commit.message = 'Initial commit with "none" values\n';
    commit.tree = Project.none;
    commit.parents = [];

    commit.file = CommitFile.createFromObject(commit);
    commit.hash = new Uint8Array(20);
    Sha1.hash(commit.file, commit.hash, 0);
    Store.save(firstPushStore, commit);
    console.log('[firstPush] created commit with hash', hex(commit.hash));

    var branch = 'refs/heads/test-branch';

    var files = [];
    var i;
    for (i = 0; i < firstPushStore.objects.length; i++) {
        var list = firstPushStore.objects[i];
        var j;
        for (j = 0; j < list.length; j++) {
            files.push(list[j].file);
        }
    }

    var pack = Pack.create(files);
    console.log('[firstPush] created pack with hash', hex(pack.subarray(pack.length - 20)));

    var body = SendPack.postBody(branch, SendPack.zeroHash, commit.hash, pack);

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
        cloneGet();
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    console.log('[firstPush] post ' + body.length + ' bytes');
    xhr.send(body);
};

var cloneGet = function () {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        var response = new Uint8Array(this.response);
        console.log('[cloneGet] received ' + response.length + ' bytes');
        console.log(pretty(response));
        var errorMessage = FetchPack.validateGetResponse(response);
        if (errorMessage) {
            console.log(errorMessage);
            return;
        }
        var refs = FetchPack.refsFromGetResponse(response);
        clonePost(refs);
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });
    xhr.responseType = 'arraybuffer';

    xhr.open('GET', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.getPath);
    console.log('[cloneGet] get');
    xhr.send();
};

var clonePost = function (refs) {
    if (!refs.length) {
        throw new Error('Expected refs for clone');
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
    console.log('[clonePost] cloning commit', hex(refHash));

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        var response = new Uint8Array(this.response);
        console.log('[clonePost] received ' + response.length + ' bytes');
        var pack = FetchPack.packFromPostResponse(response);
        if (!pack) {
            throw new Error('[clonePost] pack not received');
        }
        afterClone(refHash, pack);
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });
    xhr.responseType = 'arraybuffer';

    var body = FetchPack.postBody([], null, [refHash], null);

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + FetchPack.postPath);
    xhr.setRequestHeader('Content-Type', FetchPack.postContentType);
    console.log('[clonePost] post ' + body.length + ' bytes');
    xhr.send(body);
};

var afterClone = function (refHash, pack) {
    var index = PackIndex.create(pack);
    var loadStore = Store.create();
    var commit = CommitObject.checkout([index], loadStore, refHash, 0);
    console.log('[afterClone] commit message: ' + commit.message);
    console.log('[afterClone] commit time: ' + new Date(commit.committer.time));

    CommitObject.checkoutTree(commit, [index], loadStore);

    console.log('[afterClone] loaded tree:', hex(commit.tree.hash));
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
    project.text = 'blah blah text';
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

    var branch = 'refs/heads/test-branch';

    var body = SendPack.postBody(branch, commit.hash, commit2.hash, pack);

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    console.log('[afterClone] SendPack post ' + body.length + ' bytes');
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

initGet();

});
