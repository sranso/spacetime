'use strict';
global.Autocomplete = {};
(function () {

var autocompleteContainer;
var autocompleteInput;
var autocompleteOriginal;
var autocompleteResults;
var selectedCell;
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

    autocompleteInput.addEventListener('input', onInput);
    autocompleteInput.addEventListener('keydown', onKeyDown);

    matches = [];
};

Autocomplete.selectCell = function () {
    var project = get($head, Commit.tree);
    var parentCell = get(project, Project.cell);

    var columns = get(parentCell, Cell.columns);
    var lenColumns = len(columns);

    selectedCell = null;
    if ($c >= 0 && $c < lenColumns) {
        var selectedColumn = getAt(columns, $c);
        if ($r >= 0 && $r < len(selectedColumn)) {
            selectedCell = getAt(selectedColumn, $r);
        }
    }
    if (selectedCell) {
        autocompleteContainer.style.display = 'block';
        Ui.moveAutocomplete(autocompleteContainer);

        var text = val(get(selectedCell, Cell.text));
        autocompleteInput.value = text;
        autocompleteInput.focus();
        autocompleteInput.setSelectionRange(0, text.length);
        autocompleteOriginal.style.display = 'none';

        matches = [];
        selectedMatchIndex = 0;
        drawMatches();
    } else {
        autocompleteContainer.style.display = 'none';
    }
};

var onInput = function (e) {
    if (!selectedCell) {
        return;
    }

    var originalText = val(get(selectedCell, Cell.text));
    var text = autocompleteInput.value;

    if (text === originalText) {
        autocompleteOriginal.style.display = 'none';
        return;
    }

    autocompleteOriginal.style.display = 'block';
    autocompleteOriginal.innerText = originalText;

    updateMatches();
};

var updateMatches = function () {
    var text = autocompleteInput.value;
    if (text === '') {
        matches = defaultEntries;
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
    }
};

var selectMatch = function () {
    if (!selectedCell) {
        return;
    }

    var text = autocompleteInput.value;
    if (selectedMatchIndex >= matches.length) {
        var matchText = text;
    } else {
        var matchText = matches[selectedMatchIndex];
    }

    if (matchText === 'undo') {
        var parent = get($head, Commit.parent);
        if (parent) {
            $head = parent;
        }
        autocompleteInput.value = matchText;
        autocompleteInput.setSelectionRange(0, matchText.length);
        updateMatches();
    } else {
        var project = get($head, Commit.tree);
        var parentCell = get(project, Project.cell);
        var columns = get(parentCell, Cell.columns);
        var selectedColumn = getAt(columns, $c);
        selectedCell = set(selectedCell, Cell.text, hash(matchText));
        selectedColumn = setAt(selectedColumn, $r, selectedCell);
        columns = setAt(columns, $c, selectedColumn);
        parentCell = set(parentCell, Cell.columns, columns);
        project = set(project, Project.cell, parentCell);
        var now = hash(Math.floor(+Date.now() / 1000));
        $head = createCommit($head,
                            Commit.tree, project,
                            Commit.parent, $head,
                            Commit.committerTime, now);

        Autocomplete.selectCell();
    }

    Main.update();
};

})();
