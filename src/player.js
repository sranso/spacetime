'use strict';
var Player = {};
(function () {

Player.create = function () {
    var player = {
        id: Main.newId(),
        atBeginning: Step.createForEnvironment(),
        time: Step.createForEnvironment(),
        endTime: Step.createForEnvironment(),
        playing: Step.createForEnvironment(),
        repeating: Step.createForEnvironment(),
    };

    player.atBeginning.result = true;
    player.time.result = 0;
    player.endTime.result = 3;
    player.playing.result = false;
    player.repeating.result = false;

    player.atBeginning.stepView.player = player;
    player.time.stepView.player = player;
    player.endTime.stepView.player = player;
    player.playing.stepView.player = player;
    player.repeating.stepView.player = player;

    return player;
};

Player.updateAfterExecute = function () {
    var player = Global.player;
    var result;
    if (player.time.updatedBy) {
        result = player.time.updatedBy.result;
        if (_.isNumber(result) && !_.isNaN(result)) {
            player.time.result = result;
        }
    }
    if (player.atBeginning.updatedBy) {
        result = player.time.updatedBy.result;
        if (result === true) {
            player.time.result = 0;
        }
    }
    if (player.endTime.updatedBy) {
        result = player.endTime.updatedBy.result;
        if (_.isNumber(result) && !_.isNaN(result)) {
            player.endTime.result = result;
        }
    }
    if (player.repeating.updatedBy) {
        result = player.repeating.updatedBy.result;
        player.repeating.result = !!result;
    }

    if (player.playing.updatedBy) {
        result = player.playing.updatedBy.result;
        player.playing.result = !!result;
        if (result >= player.endTime.result && !player.repeating.result) {
            player.playing.result = false;
        }
    }
};

var lastTime = window.performance.now();
Player.step = function (now) {
    var delta = (now - lastTime) / 1000;
    lastTime = now;

    var player = Global.player;
    if (player.playing.result) {
        player.time.result += delta;
        if (player.time.result > player.endTime.result) {
            if (player.repeating.result) {
                player.time.result -= player.endTime.result;
            } else {
                player.time.result = 0;
                player.playing.result = false;
            }
        }
        Main.update();
    }
    window.requestAnimationFrame(Player.step);
};

})();
