'use strict';
var Library = {};
(function () {

var baseGroup;

Library.setup = function () {
    baseGroup = Group.create();
    baseGroup.color = [0, 0, 30];
    baseGroup.remember = true;

    var exampleQuads = Quads.move(Quads.scale(Quads.pixel(), 30, 30), 100, 100);
    var exampleQuadsStep = Step.create();
    exampleQuadsStep.result = exampleQuads;
    exampleQuadsStep.__index = 1;

    var secondExampleQuads = Quads.move(Quads.scale(Quads.pixel(), 10, 10), 50, 50);
    var secondExampleQuadsStep = Step.create();
    secondExampleQuadsStep.result = secondExampleQuads;
    secondExampleQuadsStep.__index = 0;


    var blankQuads = Quads.create();
    var blankQuadsStep = Step.create();
    blankQuadsStep.result = blankQuads;
    blankQuadsStep.__index = 1;

    var actions = [];

    ///// pixel
    var basePixel = createBase();
    var references = [createReference(basePixel, blankQuadsStep)];
    Step.setReferences(basePixel, references);
    basePixel.text = 'pixel ' + Reference.sentinelCharacter;

    setupSuper(basePixel);
    actions.push([basePixel, Quads.pixel]);


    ///// scale
    var baseScale = createBase();
    var references = [
        createReference(baseScale, exampleQuadsStep),
        createLiteral(baseScale, 2),
        createLiteral(baseScale, 2),
    ];
    Step.setReferences(baseScale, references);
    baseScale.text = 'scale ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter;

    setupSuper(baseScale);
    actions.push([baseScale, Quads.scale]);


    ///// rotate
    var baseRotate = createBase();
    var references = [
        createReference(baseRotate, exampleQuadsStep),
        createLiteral(baseRotate, 45),
    ];
    Step.setReferences(baseRotate, references);
    baseRotate.text = 'rotate ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter;

    setupSuper(baseRotate);
    actions.push([baseRotate, Quads.rotate]);


    ///// move
    var baseMove = createBase();
    var references = [
        createReference(baseMove, exampleQuadsStep),
        createLiteral(baseMove, 20),
        createLiteral(baseMove, 20),
    ];
    Step.setReferences(baseMove, references);
    baseMove.text = 'move ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter;

    setupSuper(baseMove);
    actions.push([baseMove, Quads.move]);


    ///// shear
    var baseShear = createBase();
    var references = [
        createReference(baseShear, exampleQuadsStep),
        createLiteral(baseShear, 1),
    ];
    Step.setReferences(baseShear, references);
    baseShear.text = 'shear ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter;

    setupSuper(baseShear);
    actions.push([baseShear, Quads.shear]);


    ///// pin
    var basePin = createBase();
    var references = [
        createReference(basePin, blankQuadsStep),
        createLiteral(basePin, 20),
        createLiteral(basePin, 20),
    ];
    Step.setReferences(basePin, references);
    basePin.text = 'pin ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter;

    setupSuper(basePin);
    actions.push([basePin, Quads.pin]);


    ///// combine
    var baseCombine = createBase();
    var references = [
        createReference(baseCombine, exampleQuadsStep),
        createReference(baseCombine, secondExampleQuadsStep),
    ];
    Step.setReferences(baseCombine, references);
    baseCombine.text = 'combine ' + Reference.sentinelCharacter + ' ' + Reference.sentinelCharacter;

    setupSuper(baseCombine);
    actions.push([baseCombine, Quads.combine]);


    Library.actions = {};
    _.each(actions, function (a) {
        var step = a[0];
        var action = a[1];
        Library.actions[step.matchesId] = action;
    });
};

var setupSuper = function (base) {
    var stretch = Stretch.createGroupStretch();
    stretch.group = baseGroup;
    baseGroup.stretches.push(stretch);

    var step = SuperStep.create();
    step.groupStretch = stretch;
    step.references = base.references.slice();
    step.text = base.text;
    Stretch.setSteps(step, [base]);

    Autocomplete.registerStep(step);
};

var createBase = function () {
    var base = Step.create();
    base.matchesId = Main.newId();
    base.base = true;
    base.__index = 2;
    return base;
};

var createReference = function (sink, source) {
    var reference = Reference.create();
    reference.sink = sink;
    reference.source = source;
    return reference;
};

var createLiteral = function (sink, result) {
    var reference = Reference.create();
    reference.sink = sink;
    reference.source = reference;
    reference.result = result;
    return reference;
};

})();
