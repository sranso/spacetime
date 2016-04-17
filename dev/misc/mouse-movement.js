// Results:

// e.g.:
// 0
//    0 |   -1  -13  -49  -98
// -160 |  -66 -108 -152 -180
// -202 |  -13  -17  -21  -22
//  -22 |    3    5    7    8
// -376
//  -17 |   -5   -9  -12  -14
//  -16 |    0    0    0    0
//    0 |    0    0    0    0
//    0 |    0    0    0    0
// -33
//    0 |    0    0    0    0
//    0 |    0    0    0    0
//    0 |    0    0    0    0
//    0 |    0    0    0    0
//
//
// Conclusion is 5-ary is too much at base level.
// If movement is 50 px per frame, that's:
//    Math.pow(50, 5) * 128  = 40 GB
// or Math.pow(50, 4) * 128  = 800 MB
//
//    (why 128? It's 64/3 per hash and 64/3 for data, and the
//     target fullness of the table is 1/3, so (3 * 2 * 64/3 = 128.)
//
// If mouse data is approaching the "full" 800 MB for the lowest
// level, then the number of hashes per 60 frames (1 second) is:
//    1.5 at lowest level (0 to 3 out of 12)
//    2.2 for keyframes (8.3% repeated out of 2.4)
//    2.35 for second level (2% repeated out of 2.4)
//    0.5 for third level (0% repeated)
//    0.5 for second level keyframes (0% repeated)
//    0.1 for fourth level (0% repeated)
//    0.1 for third level keyframes (0% repeated)
//    0.05 for all remaining levels combined
//  = 7.3 total for one coordinate (for active mouse.)
//  = 14.6 total for both coordinates.
//
// How quickly will 14.6 hashes per second fill up?
//
//     1.1 MB in 10 min   (14.6 * 60 * 10      * 128)
//     6.7 MB in  1 hr    (14.6 * 60 * 60      * 128)
//    27.  MB in  1 day   (14.6 * 60 * 60 * 24 * 128)
//   161.  MB in  1 day   (14.6 * 60 * 60 * 24 * 128)
//   161.  MB in  1 day   (14.6 * 60 * 60 * 24 * 128)
// 1.43 GB    in ~9 days  (14.6 * 60 * 60 * 24 * 128 * 9) = max in one hash table (1.33 GiB)
//
// But remember, this is for an active mouse.
// Idle time costs almost nothing.

var startX = 0;
var x = 0;
var len = 80;
var i = len;

var startButton = document.getElementById('start');
startButton.addEventListener('click', function (event) {
    x = startX = event.clientX;
    i = 0;
});

window.addEventListener('mousemove', function (event) {
    x = event.clientX;
});

var xs = [];

var go = function (now) {
    if (i < len) {
        xs[i] = x;
        i++;
        if (i === len) {
            results();
        }
    }
    window.requestAnimationFrame(go);
};

var keyBy = 4;

var pad = function (num) {
    return ('   ' + num).slice(-4);
};

var line = function (j) {
    var key = xs[j];
    var previousKey = j > 0 ? xs[j - keyBy] : key;
    var text = pad(key - previousKey) + ' | ';

    var i;
    for (i = 1; i < keyBy; i++) {
        var x = xs[j + i];
        text += pad(x - key) + ' ';
    }
    console.log(text);
};

var block = function (j) {
    var keyBySquared = keyBy * keyBy
    var key = xs[j];
    var previousKey = j > 0 ? xs[j - keyBySquared] : key;
    console.log(key - previousKey);

    var i;
    for (i = 1; i < keyBy; i++) {
        line(j + keyBy * i);
    }
};

var results = function () {
    var keyBySquared = keyBy * keyBy

    var j;
    for (j = 0; j <= (len - keyBySquared); j += keyBySquared) {
        block(j);
    }
    console.log('---------');
    console.log('');
};

go();
