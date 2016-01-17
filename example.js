var Store = require('./store');
var GitFile = require('./git-file');
var Sha1 = require('./sha1');

var Grid = {};
Grid.offsets = {};

Grid.clone = function (original) {
    return {
        rows: original.rows,
        columns: original.columns,
        cell1: original.cell1,
        cell2: original.cell2,
        cell3: original.cell3,
        file: original.file,
        hash: original.hash,
        hashOffset: original.hashOffset,
    };
};

Grid.none = Grid.clone({
    rows: 0,
    columns: 0,
    cell1: null,
    cell2: null,
    cell3: null,
    file: new Uint8Array(0),
    hash: new Uint8Array(20),
    hashOffset: 0,
});

Grid.none.file = GitFile.createSkeleton(Grid.offsets, {
    rows: 'blob',
    columns: 'blob',
    cell1: 'tree',
    cell2: 'tree',
    cell3: 'tree',
});

var zeroBlob = GitFile.blobFromString('0');
Sha1.hash(zeroBlob, Grid.none.file, Grid.offsets.rows);
GitFile.setHash(Grid.none.file, Grid.offsets.columns, Grid.none.file, Grid.offsets.rows);
Store.save(Store.createBlobObject(0, zeroBlob, Grid.none.file, Grid.offsets.rows));

Sha1.hash(Grid.none.file, Grid.none.hash, Grid.none.hashOffset);
Store.save(Grid.none);

console.log(GitFile.catFile(Grid.none.file));


var Cell = {};
Cell.offsets = {};

Cell.clone = function (original) {
    return {
        grid: original.grid,
        text: original.text,
        color: original.color,
        file: original.file,
        hash: original.hash,
        hashOffset: original.hashOffset,
    };
};

Cell.none = Cell.clone({
    grid: null,
    text: '',
    color: 'white',
    file: new Uint8Array(0),
    hash: new Uint8Array(20),
    hashOffset: 0,
});

Cell.none.file = GitFile.createSkeleton(Cell.offsets, {
    grid: 'tree',
    text: 'blob',
    color: 'blob',
});

var colorBlob = GitFile.blobFromString('' + Cell.none.color);
Sha1.hash(colorBlob, Cell.none.file, Cell.offsets.color);
Store.save(Store.createBlobObject(Cell.none.color, colorBlob, Cell.none.file, Cell.offsets.color));

Sha1.hash(Cell.none.file, Cell.none.hash, Cell.none.hashOffset);
Store.save(Cell.none);

console.log('###');
console.log(GitFile.catFile(Cell.none.file));
console.log('');
console.log(Store.prettyPrint());
