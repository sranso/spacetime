var Store = require('./store');
var GitFile = require('./git-file');
var Sha1 = require('./sha1');
var HighLevelApi = require('./high-level-api');

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

HighLevelApi.setup(Grid);

var zeroBlob = GitFile.blobFromString('0');
Sha1.hash(zeroBlob, Grid.none.file, Grid.offsets.rows);
GitFile.setHash(Grid.none.file, Grid.offsets.columns, Grid.none.file, Grid.offsets.rows);
Store.save(Store.createBlobObject(0, zeroBlob, Grid.none.file, Grid.offsets.rows));

Grid.none.hash = new Uint8Array(20);
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

HighLevelApi.setup(Cell);

var colorBlob = GitFile.blobFromString(Cell.none.color);
Sha1.hash(colorBlob, Cell.none.file, Cell.offsets.color);
Store.save(Store.createBlobObject(Cell.none.color, colorBlob, Cell.none.file, Cell.offsets.color));

Cell.none.hash = new Uint8Array(20);
Sha1.hash(Cell.none.file, Cell.none.hash, Cell.none.hashOffset);
Store.save(Cell.none);

console.log('###');
console.log(GitFile.catFile(Cell.none.file));
console.log('');
console.log(Store.prettyPrint());

console.log('###');

// low-level
var grid1 = Grid.clone(Grid.none);

var cell1 = Cell.clone(Cell.none);
cell1.text = 'foo';
var blob = GitFile.blobFromString(cell1.text);
Sha1.hash(blob, cell1.file, Cell.offsets.text);
Store.save(Store.createBlobObject(cell1.text, blob, cell1.file, Cell.offsets.text));

cell1.hash = grid1.file;
cell1.hashOffset = Grid.offsets.cell1;
Sha1.hash(cell1.file, cell1.hash, cell1.hashOffset);
grid1.cell1 = Store.save(cell1);

grid1.hash = new Uint8Array(20);
Sha1.hash(grid1.file, grid1.hash, grid1.hashOffset);
Store.save(grid1);

// high-level
var cell2 = Cell.set(cell1, 'color', 'red');
var cell3 = Cell.set(cell2, 'text', 'bar');
var grid2 = Grid.setAll(grid1, {cell2: cell2, cell3: cell3});

console.log(Store.prettyPrint());
