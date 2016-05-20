'use strict';
var Histogram = {};
(function () {

Histogram.create = function (min) {
    return {
        min: min,
        data: [],
        buckets: [],
    };
};

Histogram.push = function (histogram, d) {
    histogram.data.push(d);
};

Histogram.output = function (histogram) {
    var data = histogram.data;

    var buckets = [];
    histogram.buckets = buckets;

    var i;
    for (i = 0; i < data.length; i++) {
        var bucketI = data[i] - histogram.min;
        buckets[bucketI] = (buckets[bucketI] || 0) + 1;
    }

    console.log(buckets);
};

Histogram.countRange = function (histogram, low, high) {
    var sum = 0;
    var i;
    for (i = low; i <= high; i++) {
        sum += histogram.buckets[i - histogram.min] || 0;
    }
    return sum;
};

})();
