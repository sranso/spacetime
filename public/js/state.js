var stateInit = function () {
    state = {
        target: null,
        targets: [],
        inserting: null,
        moving: null,
        hovering: null,
        selection: null,
        selectionBegin: null,
        selectionEnd: null,

        targetMode: null,
        insertingMode: null,
        movingMode: null,
        hoveringMode: null,
        selectionMode: null,

        doStructure: false,
        doPositions: false,
        doHovering: false,
        doDraw: false,
        doDataDraw: false,

        targetKind: null,
        startMouse: [0, 0],
        inCamera: false,
        insertingNumber: false,
        firstInserting: false,
    };
    lastState = state;
};

var updateState = function (update) {
    _.extend(state, update);
    if (!state.inserting) {
        state.insertingMode = null;
        state.insertingNumber = null;
    }
    if (!state.moving) { state.movingMode = null }
    if (!state.hovering) { state.hoveringMode = null }
    if (!state.selection) {
        state.selectionBegin = null;
        state.selectionEnd = null;
        state.selectionMode = null;
    }
    state.target = (
        state.moving ||
        state.selectionEnd ||
        state.inserting ||
        state.hovering
    );
    state.targets = state.selection || _.compact([state.target]);
    state.targetMode = (
        state.movingMode ||
        state.selectionMode ||
        state.insertingMode ||
        state.hoveringMode
    );
    state.targetKind = (
        state.moving && 'moving' ||
        state.selectionBegin && 'selection' ||
        state.inserting && 'inserting' ||
        state.hovering && 'hovering'
    );
};

var doStuffAfterStateChanges = function () {
    if (state.doStructure) {
        computeStructure(state.doStructure);
    }
    if (state.doPositions) {
        computePositions(allViewTree);
    }
    if (state.doHovering) {
        computeHovering();
    }
    var updatedTarget = (
        state.target !== lastState.target ||
        state.targetMode !== lastState.targetMode ||
        state.targetKind !== lastState.targetKind
    );
    if (updatedTarget) {
        _.each(state.targets, computePositions);
        if (!state.doDataDraw) {
            _.each(lastState.targets, computePositions);
        }
    };
    if (state.doDraw || state.doDataDraw) {
        var sel = fullSelection(state.doDataDraw);
        draw(sel);
    }
};

var immediateDoStuffAfterStateChanges = function (callback) {
    lastState = state;
    state = _.clone(state);
    state.selection = state.selection ? state.selection.slice() : null;
    callback();
    doStuffAfterStateChanges();
};

var doStuffAroundStateChanges = function (callback) {
    return function () {
        var args = arguments;
        immediateDoStuffAfterStateChanges(function () {
            callback.apply(this, args);
        });
    };
};
