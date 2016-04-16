'use strict';
if (typeof exports === 'undefined') {
    global._ = {
        random: global._.random,
    };
} else {
    // TODO: implement a seedable PRNG, and replace _.random
    // with something else.
    global._ = {random: require('../app/vendor/underscore').random};
}
