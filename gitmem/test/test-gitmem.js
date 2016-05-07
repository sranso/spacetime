'use strict';
require('../../test/helper');

var oldSeedFunction = Gitmem._randomSeed;
Gitmem._randomSeed = function () {
    return 1;
};

Gitmem.initialize();
var gitmem = Gitmem.create();
Gitmem.load(gitmem);
Gitmem._randomSeed = oldSeedFunction;

HashTable.save($hashTable, Value.createBlobObject('', Blob.emptyBlob, Blob.emptyBlobHash, 0));
HashTable.save($hashTable, Value.none);

var Grid = {};

Grid.offsets = {};

var noneFile = Tree.createSkeleton(Grid.offsets, {
    rows: 'blob',
    columns: 'blob',
    cell1: 'tree',
    cell2: 'tree',
    cell3: 'tree',
});

var noneFileRange = Heap.staticAllocate(noneFile);

Grid.types = {
    rows: 'number',
    columns: 'number',
    cell1: 'object',
    cell2: 'object',
    cell3: 'object',
};

Grid.cloneWithoutFile = function (original) {
    return {
        rows: original.rows,
        columns: original.columns,
        cell1: original.cell1,
        cell2: original.cell2,
        cell3: original.cell3,
        fileStart: -1,
        fileEnd: -1,
        hashOffset: -1,
    };
};

Grid.clone = function (original) {
    var grid = Grid.cloneWithoutFile(original);
    var fileRange = GitFile.copyFile(original.fileStart, original.fileEnd);
    grid.fileStart = fileRange[0];
    grid.fileEnd = fileRange[1];
    return grid;
};

Grid.none = Grid.clone({
    rows: 0,
    columns: 0,
    cell1: null,
    cell2: null,
    cell3: null,
    fileStart: noneFileRange[0],
    fileEnd: noneFileRange[1],
    hashOffset: 0,
});

var checkoutFile = function (fileStart, fileEnd) {
    var grid = clone(Grid.none);

    grid.rows = Value.checkout($, fileStart + offsets.rows, types.rows);
    grid.columns = Value.checkout($, fileStart + offsets.columns, types.columns);
    grid.cell1 = Cell.checkout(fileStart + offsets.cell1);
    grid.cell2 = Cell.checkout(fileStart + offsets.cell2);
    grid.cell3 = Cell.checkout(fileStart + offsets.cell3);

    return grid;
};

Grid.checkout = function (searchHashOffset) {
    return FastCheckout.checkout(searchHashOffset, checkoutFile);
};

var traverseChildren = [];

Grid.initialize = function () {
    traverseChildren[0] = Value.traverse;
    traverseChildren[1] = -1;
    traverseChildren[2] = Value.traverse;
    traverseChildren[3] = -1;
    traverseChildren[4] = Cell.traverse;
    traverseChildren[5] = null;
    traverseChildren[6] = Cell.traverse;
    traverseChildren[7] = null;
    traverseChildren[8] = Cell.traverse;
    traverseChildren[9] = null;
};

Grid.traverse = function (grid) {
    traverseChildren[1] = grid.fileStart + offsets.rows;
    traverseChildren[3] = grid.fileStart + offsets.columns;
    traverseChildren[5] = grid.cell1;
    traverseChildren[7] = grid.cell2;
    traverseChildren[9] = grid.cell3;
    return traverseChildren;
};

Grid.set = function (original, prop, value) {
    var grid = Grid.clone(original);
    BaseTreeObject.set(grid, prop, value, Grid.offsets[prop], Grid.types[prop]);
    grid.hash = new Uint8Array(20);
    Sha1.hash(grid.file, grid.hash, 0);

    return HashTable.save($hashTable, grid);
};

Grid.setAll = function (original, modifications) {
    var grid = Grid.clone(original);

    for (var prop in modifications) {
        var value = modifications[prop];
        BaseTreeObject.set(grid, prop, value, Grid.offsets[prop], Grid.types[prop]);
    }
    grid.hash = new Uint8Array(20);
    Sha1.hash(grid.file, grid.hash, 0);

    return HashTable.save($hashTable, grid);
};

var zeroBlob = Value.createBlob(0, 'number', []);
Sha1.hash(zeroBlob, Grid.none.file, Grid.offsets.rows);
Tree.setHash(Grid.none.file, Grid.offsets.columns, Grid.none.file, Grid.offsets.rows);
HashTable.save($hashTable, Value.createBlobObject(0, zeroBlob, Grid.none.file, Grid.offsets.rows));

Grid.none.hash = new Uint8Array(20);
Sha1.hash(Grid.none.file, Grid.none.hash, Grid.none.hashOffset);
HashTable.save($hashTable, Grid.none);

log(prettyTree(Grid.none.file));
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    cell1
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    cell2
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    cell3
//=> 100644 blob c227083464fb9af8955c90d2924774ee50abb547    columns
//=> 100644 blob c227083464fb9af8955c90d2924774ee50abb547    rows


var Cell = {};

Cell.clone = function (original) {
    return {
        grid: original.grid,
        text: original.text,
        color: original.color,
        file: original.file.slice(),
        hash: null,
        hashOffset: 0,
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

Cell.offsets = {};

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

Cell.checkout = function (packIndices, table, hash, hashOffset) {
    var cell = HashTable.get(table, hash, hashOffset);
    if (cell) {
        return cell;
    }

    var packs = packIndices;
    var file = PackIndex.lookupFileMultiple(packs, hash, hashOffset);

    var ofs = Cell.offsets;
    cell = Cell.clone(Cell.none);
    cell.file = file;
    cell.hash = hash;
    cell.hashOffset = hashOffset;
    HashTable.save(table, cell);

    cell.text = Value.checkoutString(packs, table, file, ofs.text);
    cell.color = Value.checkoutString(packs, table, file, ofs.color);
    cell.grid = Grid.checkout(packs, table, file, ofs.grid);

    return cell;
};

Cell.set = function (original, prop, value) {
    var cell = Cell.clone(original);
    BaseTreeObject.set(cell, prop, value, Cell.offsets[prop], Cell.types[prop]);
    cell.hash = new Uint8Array(20);
    Sha1.hash(cell.file, cell.hash, 0);

    return HashTable.save($hashTable, cell);
};

Cell.setAll = function (original, modifications) {
    var cell = Cell.clone(original);

    for (var prop in modifications) {
        var value = modifications[prop];
        BaseTreeObject.set(cell, prop, value, Cell.offsets[prop], Cell.types[prop]);
    }
    cell.hash = new Uint8Array(20);
    Sha1.hash(cell.file, cell.hash, 0);

    return HashTable.save($hashTable, cell);
};


var colorBlob = Value.createBlob(Cell.none.color, 'string', []);
Sha1.hash(colorBlob, Cell.none.file, Cell.offsets.color);
HashTable.save($hashTable, Value.createBlobObject(Cell.none.color, colorBlob, Cell.none.file, Cell.offsets.color));

Cell.none.hash = new Uint8Array(20);
Sha1.hash(Cell.none.file, Cell.none.hash, Cell.none.hashOffset);
HashTable.save($hashTable, Cell.none);

log(prettyTree(Cell.none.file));
//=> 100644 blob 03c7548022813b90e8b84dba373b867c18d991e6    color
//=> 040000 tree 70bfe9793f3fc43d2a2306a58186fe0c88b86999    grid
//=> 100644 blob e69de29bb2d1d6434b8b29ae775ad8c2e48c5391    text
log(prettyHashTable($hashTable));
//=> 1: #<70bfe9 null>
//=> 2: #<03c754 white>, #<4b14dc grid=null text= color=white>
//=> 4: #<c22708 0>
//=> 5: #<e69de2 >, #<dbf0d8 rows=0 colu..=0 cell1=null cell2=n..>

// low-level
var grid1 = Grid.clone(Grid.none);

var cell1 = Cell.clone(Cell.none);
cell1.text = 'foo';
var blob = Value.createBlob(cell1.text, 'string', []);
Sha1.hash(blob, cell1.file, Cell.offsets.text);
HashTable.save($hashTable, Value.createBlobObject(cell1.text, blob, cell1.file, Cell.offsets.text));

cell1.hash = grid1.file;
cell1.hashOffset = Grid.offsets.cell1;
Sha1.hash(cell1.file, cell1.hash, cell1.hashOffset);
grid1.cell1 = HashTable.save($hashTable, cell1);

grid1.hash = new Uint8Array(20);
Sha1.hash(grid1.file, grid1.hash, grid1.hashOffset);
HashTable.save($hashTable, grid1);

// high-level
var cell2 = Cell.set(cell1, 'color', 'red');
var cell3 = Cell.set(cell2, 'text', 'bar');
var grid2 = Grid.setAll(grid1, {
    rows: 3,
    columns: 1,
    cell2: cell2,
    cell3: cell3,
});

log(hex(grid2.hash));
//=> b20786edf47f056fea926f16862c4b01a9ea39e9

log(prettyHashTable($hashTable));
//=> 5: #<70bfe9 null>, #<56a605 1>
//=> 9: #<4b14dc grid=null text= color=white>, #<05dafb rows=0 colu..=0 cell1=[obj.. cell2..>
//=> 10: #<03c754 white>
//=> 14: #<89ced6 grid=null text=foo color=red>
//=> 16: #<b20786 rows=3 colu..=1 cell1=[obj.. cell2..>
//=> 19: #<c22708 0>
//=> 20: #<e69de2 >
//=> 21: #<dbf0d8 rows=0 colu..=0 cell1=null cell2=n..>
//=> 22: #<daf773 grid=null text=bar color=red>
//=> 25: #<b5a955 bar>
//=> 26: #<6f1e0d grid=null text=foo color=white>
//=> 27: #<e440e5 3>
//=> 29: #<d45772 foo>
//=> 31: #<0af810 red>

var objects = $hashTable.objects.reduce(function (a, b) {
    return a.concat(b);
}, []);
var files = objects.map(function (a) {
    return a.file;
});
var pack = Pack.create(files);
var index = PackIndex.create(pack);
var random = Random.create(518917);
var newHashTable = HashTable.create(random);

var gotGrid = Grid.checkout([index], newHashTable, grid2.hash, grid2.hashOffset);
log(hex(gotGrid.hash));
//=> b20786edf47f056fea926f16862c4b01a9ea39e9

log(gotGrid.rows, gotGrid.columns, gotGrid.cell1.text);
//=> 3 1 'foo'
log(gotGrid.cell2.color, gotGrid.cell3.text);
//=> red bar

log(prettyHashTable(newHashTable));
//=> 0: #<6f1e0d grid=null text=foo color=white>, #<89ced6 grid=null text=foo color=red>
//=> 1: #<0af810 red>
//=> 3: #<e440e5 3>
//=> 5: #<daf773 grid=null text=bar color=red>
//=> 8: #<b5a955 bar>
//=> 9: #<56a605 1>
//=> 12: #<b20786 rows=3 colu..=1 cell1=[obj.. cell2..>
//=> 13: #<d45772 foo>
//=> 14: #<03c754 white>