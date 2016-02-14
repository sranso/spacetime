Loader.loadWeb('../..', function (event) {

var pushStore = Global.store = Store.create();

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

var tOffsets = {};

Thing.none.file = Tree.createSkeleton(tOffsets, {
    name: 'blob',
});

BaseTreeObject.set(Thing.none, 'name', Thing.none.name, tOffsets.name, 'string');
Thing.none.hash = new Uint8Array(20);
Sha1.hash(Thing.none.file, Thing.none.hash, 0);
Store.save(pushStore, Thing.none);

Thing.checkout = function (packIndices, store, hash, hashOffset) {
    var thing = Store.get(store, hash, hashOffset);
    if (thing) {
        return thing;
    }

    var file = PackIndex.lookupFileMultiple(packIndices, hash, hashOffset);

    thing = Thing.clone(Thing.none);
    thing.name = Thing.checkout(packIndices, store, file, tOffsets.name);
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

var pOffsets = {};

Project.none.file = Tree.createSkeleton(pOffsets, {
    hasStuff: 'blob',
    thing: 'tree',
    text: 'blob',
    xPosition: 'blob',
});

BaseTreeObject.set(Project.none, 'thing', Project.none.thing, pOffsets.thing, 'object');
BaseTreeObject.set(Project.none, 'text', Project.none.text, pOffsets.text, 'string');
BaseTreeObject.set(Project.none, 'xPosition', Project.none.xPosition, pOffsets.xPosition, 'number');
BaseTreeObject.set(Project.none, 'hasStuff', Project.none.hasStuff, pOffsets.hasStuff, 'boolean');
Project.none.hash = new Uint8Array(20);
Sha1.hash(Project.none.file, Project.none.hash, 0);
Store.save(pushStore, Project.none);

Project.checkout = function (packIndices, store, hash, hashOffset) {
    var project = Store.get(store, hash, hashOffset);
    if (project) {
        return project;
    }

    var packs = packIndices;
    var file = PackIndex.lookupFileMultiple(packs, hash, hashOffset);

    var ofs = pOffsets;
    project = Project.clone(Project.none);
    project.thing = Thing.checkout(packs, store, file, ofs.thing);
    project.text = Value.checkoutString(packs, store, file, ofs.text);
    project.xPosition = Value.checkoutString(packs, store, file, ofs.xPosition);
    project.hasStuff = Value.checkoutString(packs, store, file, ofs.hasStuff);
    project.file = file;
    project.hash = hash;
    project.hashOffset = hashOffset;

    return Store.save(store, project);
};


var pushFirst = function () {
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
    Store.save(pushStore, commit);
    console.log('[pushFirst] created commit with hash', hex(commit.hash));

    var previousHash = new Uint8Array(20);

    var branch = 'refs/heads/master';

    var files = [];
    var i;
    for (i = 0; i < pushStore.objects.length; i++) {
        var list = pushStore.objects[i];
        var j;
        for (j = 0; j < list.length; j++) {
            files.push(list[j].file);
        }
    }

    var pack = Pack.create(files);
    console.log('[pushFirst] created pack with hash', hex(pack.subarray(pack.length - 20)));

    var body = SendPack.postBody(branch, previousHash, commit.hash, pack);

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function () {
        console.log(this.responseText);
    });
    xhr.addEventListener('error', function () {
        console.log('error', this.statusText);
    });

    xhr.open('POST', 'http://localhost:8080/local-git/testrepo.git' + SendPack.postPath);
    xhr.setRequestHeader('Content-Type', SendPack.postContentType);
    console.log('[pushFirst] post ' + body.length + ' bytes');
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
        var pack = FetchPack.packFromPostResponse(response);
        var index = PackIndex.create(pack);
        var store = Store.create();
        var commit = CommitObject.checkout([index], store, refHash, 0);
        console.log('[clone] commit message: ' + commit.message);
        console.log('[clone] commit time: ' + new Date(commit.committer.time));
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
