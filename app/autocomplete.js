'use strict';
global.Autocomplete = {};
(function () {

var autocompleteContainer;
var autocompleteInput;
var autocompleteOriginal;
var autocompleteResults;
var matches;
var selectedMatchIndex = 0;

var entries = [
    '',
    '+',
    '-',
    '*',
    '/',

    'pixel',
    'scale',
    'scale x',
    'scale y',
    'move x',
    'move y',
    'mouse x',
    'mouse y',
    'rotate',
];

var actionEntries = [
    'go into',
    'go up',
    'delete row',
    'delete column',
    'delete right columns',
    'copy column',
    'copy over right cols',
    'insert row',
    'insert column',

    'undo',
];

entries = entries.concat(actionEntries);
var actionEntriesMap = {};
actionEntries.forEach(function (entry) {
    actionEntriesMap[entry] = true;
});

var defaultEntries = [
    '',
    'go into',
    'undo',
    'go up',
];

Autocomplete.initialize = function () {
    autocompleteContainer = document.getElementById('autocomplete');
    autocompleteInput = document.getElementById('autocomplete-input');
    autocompleteResults = document.getElementById('autocomplete-results');
    autocompleteOriginal = document.getElementById('autocomplete-original');

    autocompleteInput.addEventListener('input', updateMatches);
    autocompleteInput.addEventListener('keydown', onKeyDown);

    matches = [];
};

var getSelectedCell = function () {
    var project = get($head, Commit.tree);
    var parentCell = get(project, Project.cell);
    var columns = get(parentCell, Cell.columns);
    var lenColumns = len(columns);
    if (lenColumns > 0) {
        var lenCells = len(getAt(columns, 0));
    } else {
        var lenCells = 0;
    }

    var selectedCell = null;
    if ($c >= 0 && $c < lenColumns) {
        var selectedColumn = getAt(columns, $c);
        if ($r >= 0 && $r < len(selectedColumn)) {
            return getAt(selectedColumn, $r);
        }
    }

    var newColumn = $c === lenColumns && $r >= 0 && $r < lenCells;
    var newRow = $r === lenCells && $c >= 0 && $c < lenColumns;
    if (newColumn || newRow) {
        return $[Cell.zero];
    }
    return null;
};

Autocomplete.selectCell = function () {
    var selectedCell = getSelectedCell();
    if (selectedCell) {
        autocompleteContainer.style.display = 'block';
        Ui.moveAutocomplete(autocompleteContainer);

        var text = val(get(selectedCell, Cell.text));
        autocompleteInput.value = text;
        autocompleteInput.focus();
        autocompleteInput.setSelectionRange(0, text.length);

        updateMatches();
    } else {
        autocompleteContainer.style.display = 'none';
    }
};

var updateMatches = function () {
    var selectedCell = getSelectedCell();
    if (!selectedCell) {
        return;
    }
    var originalText = val(get(selectedCell, Cell.text));
    var text = autocompleteInput.value;

    if (text === originalText || originalText === '') {
        autocompleteOriginal.style.display = 'none';
    } else {
        autocompleteOriginal.style.display = 'block';
        autocompleteOriginal.innerText = originalText;
    }

    if (text === '') {
        matches = defaultEntries;
    } else if (text === originalText) {
        matches = [];
    } else {
        matches = [];
        var i;
        for (i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (entry.indexOf(text) === 0) {
                matches.push(entry);
                if (matches.length === 6) {
                    break;
                }
            }
        }
    }

    selectedMatchIndex = 0;
    drawMatches();
};

var drawMatches = function () {
    var matchHtml = '';
    var i;
    for (i = 0; i < matches.length; i++) {
        if (i === selectedMatchIndex) {
            matchHtml += '<li class="selected">' + matches[i] + '</li>';
        } else {
            matchHtml += '<li>' + matches[i] + '</li>';
        }
    }
    autocompleteResults.innerHTML = matchHtml;
};

var onKeyDown = function (e) {
    var tab =  e.keyCode === 9;
    var down = e.keyCode === 40;
    var up =   e.keyCode === 38;
    if (tab) {
        e.preventDefault();
    }

    var next = (tab && !e.shiftKey) || down;
    var previous = (tab && e.shiftKey) || up;
    if (next) {
        selectedMatchIndex++;
        if (selectedMatchIndex >= matches.length) {
            selectedMatchIndex = 0;
        }
    }
    if (previous) {
        selectedMatchIndex--;
        if (selectedMatchIndex < 0) {
            selectedMatchIndex = matches.length - 1;
        }
    }

    if (next || previous) {
        drawMatches();
    }

    if (e.keyCode === 13) { // enter
        selectMatch();
    } else if (e.keyCode === 27) { // esc
        $c = -1;
        $r = -1;
        autocompleteContainer.style.display = 'none';
        Main.update();
    }
};

var selectMatch = function () {
    var selectedCell = getSelectedCell();
    if (!selectedCell) {
        return;
    }

    var text = autocompleteInput.value;
    if (selectedMatchIndex >= matches.length) {
        var matchText = text;
    } else {
        var matchText = matches[selectedMatchIndex];
    }

    var project = get($head, Commit.tree);
    var parentCell = get(project, Project.cell);
    var columns = get(parentCell, Cell.columns);
    var lenColumns = len(columns);
    if (lenColumns > 0) {
        var lenCells = len(getAt(columns, 0));
    } else {
        var lenCells = 0;
    }

    var isAction = actionEntriesMap[matchText];

    var makeCommit = true;

    if (isAction) {
        switch (matchText) {
        case 'undo':
            var parent = get($head, Commit.parent);
            if (parent) {
                $head = parent;
            }
            makeCommit = false;
            break;
        case 'copy column':
            // TODO: copy current column, not just last one.
            var column = getAt(columns, lenColumns - 1);
            columns = push(columns, column);
        case 'delete right columns':
            if ($c < lenColumns - 1) {
                columns = take(columns, $c + 1);
            }
        }

    } else {
        var newColumn = $c === lenColumns && $r >= 0 && $r < lenCells;
        if (newColumn) {
            var cells = ArrayTree.$zeros[0];
            var i;
            for (i = 0; i < lenCells; i++) {
                cells = push(cells, $[Cell.zero]);
            }
            columns = push(columns, cells);
        }

        var newRow = $r === lenCells && $c >= 0 && $c < lenColumns;
        if (newRow) {
            var i;
            for (i = 0; i < lenColumns; i++) {
                var column = getAt(columns, i);
                column = push(column, $[Cell.zero]);
                columns = setAt(columns, i, column);
            }
        }

        var selectedColumn = getAt(columns, $c);
        selectedCell = set(selectedCell, Cell.text, hash(matchText));
        selectedColumn = setAt(selectedColumn, $r, selectedCell);
        columns = setAt(columns, $c, selectedColumn);
    }

    if (makeCommit) {
        parentCell = set(parentCell, Cell.columns, columns);
        var oldProject = project;
        project = set(project, Project.cell, parentCell);

        if (project !== oldProject) {
            var now = hash(Math.floor(+Date.now() / 1000));
            $head = createCommit($head,
                                Commit.tree, project,
                                Commit.parent, $head,
                                Commit.committerTime, now);
        }
    }

    if (isAction) {
        autocompleteInput.value = matchText;
        autocompleteInput.setSelectionRange(0, matchText.length);
        updateMatches();
    } else {
        $r++;
        Autocomplete.selectCell();
    }

    Main.update();
};

})();
