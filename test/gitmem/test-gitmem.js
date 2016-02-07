var helper = require('../helper');

Random.seed(1);
var store = Store.create();

Store.save(store, Value.createBlobObject('', Blob.emptyBlob, Blob.emptyBlobHash, 0));
Store.save(store, Value.createBlobObject(null, Tree.emptyTree, Tree.emptyTreeHash, 0));

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

Grid.none.file = Tree.createSkeleton(Grid.offsets, {
    rows: 'blob',
    columns: 'blob',
    cell1: 'tree',
    cell2: 'tree',
    cell3: 'tree',
});

Grid.types = {
    rows: 'number',
    columns: 'number',
    cell1: 'object',
    cell2: 'object',
    cell3: 'object',
};

Grid.set = function (original, prop, value) {
    return HighLevelStore.set(Grid, original, prop, value);
};

Grid.setAll = function (original, modifications) {
    return HighLevelStore.setAll(Grid, original, modifications);
};

var zeroBlob = Blob.createFromString('0');
Sha1.hash(zeroBlob, Grid.none.file, Grid.offsets.rows);
GitFile.setHash(Grid.none.file, Grid.offsets.columns, Grid.none.file, Grid.offsets.rows);
Store.save(store, Value.createBlobObject(0, zeroBlob, Grid.none.file, Grid.offsets.rows));

Grid.none.hash = new Uint8Array(20);
Sha1.hash(Grid.none.file, Grid.none.hash, Grid.none.hashOffset);
Store.save(store, Grid.none);

log(GitFile.catFile(Grid.none.file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    cell1
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    cell2
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    cell3
//=> 100644 blob c227083464fb9af8955c90d2924774ee50abb547    columns
//=> 100644 blob c227083464fb9af8955c90d2924774ee50abb547    rows


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

Cell.none.file = Tree.createSkeleton(Cell.offsets, {
    grid: 'tree',
    text: 'blob',
    color: 'blob',
});

Cell.types = {
    grid: 'object',
    text: 'string',
    color: 'string',
};

Cell.set = function (original, prop, value) {
    return HighLevelStore.set(Cell, original, prop, value);
};

Cell.setAll = function (original, modifications) {
    return HighLevelStore.setAll(Cell, original, modifications);
};


var colorBlob = Blob.createFromString(Cell.none.color);
Sha1.hash(colorBlob, Cell.none.file, Cell.offsets.color);
Store.save(store, Value.createBlobObject(Cell.none.color, colorBlob, Cell.none.file, Cell.offsets.color));

Cell.none.hash = new Uint8Array(20);
Sha1.hash(Cell.none.file, Cell.none.hash, Cell.none.hashOffset);
Store.save(store, Cell.none);

log(GitFile.catFile(Cell.none.file));
//=> 100644 blob 65c27486fa8046fd08f63f78cce1abc3932f97ce    color
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    grid
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    text
log(Store.prettyPrint(store));
//=> 0: #<65c274 white>
//=> 1: #<70bfe9 null>
//=> 4: #<c22708 0>
//=> 5: #<e69de2 >, #<dbf0d8 rows=0 colu..=0 cell1=null cell2=n..>, #<4ac8a1 grid=null text= color=white>

// low-level
var grid1 = Grid.clone(Grid.none);

var cell1 = Cell.clone(Cell.none);
cell1.text = 'foo';
var blob = Blob.createFromString(cell1.text);
Sha1.hash(blob, cell1.file, Cell.offsets.text);
Store.save(store, Value.createBlobObject(cell1.text, blob, cell1.file, Cell.offsets.text));

cell1.hash = grid1.file;
cell1.hashOffset = Grid.offsets.cell1;
Sha1.hash(cell1.file, cell1.hash, cell1.hashOffset);
grid1.cell1 = Store.save(store, cell1);

grid1.hash = new Uint8Array(20);
Sha1.hash(grid1.file, grid1.hash, grid1.hashOffset);
Store.save(store, grid1);

// high-level
Global.store = store;
var cell2 = Cell.set(cell1, 'color', 'red');
var cell3 = Cell.set(cell2, 'text', 'bar');
var grid2 = Grid.setAll(grid1, {cell2: cell2, cell3: cell3});

log(Store.prettyPrint(Global.store));
//=> 1: #<65c274 white>
//=> 5: #<70bfe9 null>
//=> 7: #<129cb5 grid=null text=bar color=red>
//=> 10: #<a078d7 grid=null text=foo color=red>
//=> 11: #<9c319a rows=0 colu..=0 cell1=[obj.. cell2..>
//=> 16: #<191028 foo>
//=> 19: #<c22708 0>
//=> 20: #<e69de2 >
//=> 21: #<dbf0d8 rows=0 colu..=0 cell1=null cell2=n..>, #<4ac8a1 grid=null text= color=white>
//=> 22: #<db2700 rows=0 colu..=0 cell1=[obj.. cell2..>
//=> 25: #<ba0e16 bar>
//=> 28: #<2270d3 grid=null text=foo color=white>, #<46f29e red>
