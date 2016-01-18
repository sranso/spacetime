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
        file: original.file.slice(),
        hash: null,
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
Store.savePreHashed(Store.createBlobObject(0, zeroBlob, Grid.none.file, Grid.offsets.rows));

Grid.none.hash = new Uint8Array(20);
Store.save(Grid.none);

console.log(GitFile.catFile(Grid.none.file));


var Cell = {};
Cell.offsets = {};

Cell.clone = function (original) {
    return {
        grid: original.grid,
        text: original.text,
        color: original.color,
        file: original.file.slice(),
        hash: null,
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

var colorBlob = GitFile.blobFromString(Cell.none.color);
Store.save(Store.createBlobObject(Cell.none.color, colorBlob, Cell.none.file, Cell.offsets.color));

Cell.none.hash = new Uint8Array(20);
Store.save(Cell.none);

console.log('###');
console.log(GitFile.catFile(Cell.none.file));
console.log('');
console.log(Store.prettyPrint());

console.log('###');

var grid1 = Grid.clone(Grid.none);

// cell1
var cell1 = Cell.clone(Cell.none);
cell1.text = 'foo';
var blob = GitFile.blobFromString(cell1.text);
Store.save(Store.createBlobObject(cell1.text, blob, cell1.file, Cell.offsets.text));

cell1.hash = grid1.file;
cell1.hashOffset = Grid.offsets.cell1;
grid1.cell1 = Store.save(cell1);

// cell2
var cell2 = Cell.clone(cell1);
Store.saveBlob(cell2.color = 'red', cell2.file, Cell.offsets.color);
cell2.hash = grid1.file;
cell2.hashOffset = Grid.offsets.cell2;
grid1.cell2 = Store.save(cell2);

grid1.hash = new Uint8Array(20);
Store.save(grid1);
console.log(Store.prettyPrint());
