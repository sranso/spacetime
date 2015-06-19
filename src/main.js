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
    var mouse = d3.mouse(Draw.trackContainer.node());
    Selection.maybeStart(mouse);
};

Global.steps = [Step.create()];

Step.linkSteps(Global.steps);
Global.stepsHead.next = Global.steps[0];
Global.stepsTail.previous = Global.steps[0];
Global.active = Group.create();
Global.active.hidden = true;
Global.selection = new Selection();

Global.mouseX = Step.create();
Global.mouseX.text = 'Mouse X';
Global.mouseX.result = 0;
Global.mouseX.__index = -1;
Global.mouseY = Step.create();
Global.mouseY.text = 'Mouse Y';
Global.mouseY.result = 0;
Global.mouseY.__index = -1;
Global.environment = [
    StepView.create(Global.mouseX),
    StepView.create(Global.mouseY),
];

Input.dvorak();
Draw.setup();
Main.update();

})();
