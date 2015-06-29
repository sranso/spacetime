'use strict';
var Main = {};
(function () {

Main.newId = function () {
    Global.idSequence += 1;
    return Global.idSequence;
};

Main.update = function () {
    Step.computeSteps();
    StepExecution.execute();
    StepView.computeViews();
    Active.computeActive(Global.inputStepView);
    Selection.computeInfo();
    Draw.draw();
    Webgl.drawMainCanvas();
};

Main.maybeUpdate = function (cb) {
    var lastHoverStepView = Global.hoverStepView;
    var lastHoverResultStepView = Global.hoverResultStepView;
    var lastInsertStepView = Global.inputStepView;
    var lastConnectStepView = Global.connectStepView;
    cb();
    if (
        Global.hoverStepView !== lastHoverStepView ||
        Global.hoverResultStepView !== lastHoverResultStepView ||
        Global.inputStepView !== lastInsertStepView ||
        Global.connectStepView !== lastConnectStepView
    ) {
        Main.update();
    }
};

Main.mouseUp = function () {
    Global.mouseDown.result = false;
    Selection.stop();
    Main.update();
};

Main.mouseMove = function () {
    var mouse = d3.mouse(Draw.trackContainer.node());
    Selection.maybeChange(mouse);
};

Main.mouseDown = function () {
    window.getSelection().removeAllRanges();
    Main.maybeUpdate(function () {
        Global.inputStepView = null;
        Global.connectStepView = null;
    });
    Main.update();

    var mouse = d3.mouse(Draw.trackContainer.node());
    Selection.maybeStart(mouse);
};

Global.steps = [Step.create(), Step.create(), Step.create(), Step.create(), Step.create()];

Step.linkSteps(Global.steps);
Global.stepsHead.next = Global.steps[0];
Global.stepsTail.previous = Global.steps[0];
Global.active = Group.create();
Global.active.hidden = true;
Global.selection = new Selection();

Global.mouseX = Step.createForEnvironment();
Global.mouseX.text = 'mouse x';
Global.mouseX.result = 0;
Global.mouseX.editable = false;

Global.mouseY = Step.createForEnvironment();
Global.mouseY.text = 'mouse y';
Global.mouseY.result = 0;
Global.mouseY.editable = false;

Global.mouseDown = Step.createForEnvironment();
Global.mouseDown.text = 'mouse down';
Global.mouseDown.result = false;
Global.mouseDown.editable = false;

var environment = [
    Global.mouseX,
    Global.mouseY,
    Global.mouseDown,
    Step.createForEnvironment(),
];
Global.environment = _.map(environment, StepView.create);

Input.dvorak();
Draw.setup();
Main.update();

})();
