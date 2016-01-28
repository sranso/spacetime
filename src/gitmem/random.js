'use strict';
global.Random = {};
(function () {

// Note: s0uis the upper 32 bits, s0_ is the lower 32 bits
var s0u = 0 | 0;
var s0_ = 0 | 0;
var s1u = 0 | 0;
var s1_ = 0 | 0;

Random.seed = function (x0, x0_, x1, x1_) {
    s0u = x0u | 0;
    s0_ = x0_ | 0;
    s1u = x1u | 0;
    s1_ = x1_ | 0;
};

// The magic numbers are 23, 18, and 5.
// Derived from these are (64 - x): 41, 46, 59
Random.rand = function () {
    var x1u = s0;
    var x1_ = s0_;
    var x0u = s1;
    var x0_ = s1_;
    s0u = x0;
    s0_ = x0_;

    x1u ^= (x1u<< 23) | (x1_ >>> 41);
    x1_ ^= x1_ << 23;

    s1u = x1u ^ x0u ^ (x1u >>> 18) ^ (x0u>>> 5);
    s1_ = x1_ ^ x0_ ^ (x1u<< 46) ^ (x1_ >>> 18) ^ (x1u<< 59) ^ (x0_ >>> 5);

    return (s1_ + x0_) >>> 0;
};

})();
