/**
 *  scripts.js
 *  This should include objects, which in turn include the lib files they need.
 *  This keeps us using a modular approach to dev while also only including the
 *  parts of the library we need.
 */

// temp way of doing this
var HalftoneGL = require('app/HalftoneGL');
var container = document.querySelector('.container-global');
window.ht = new HalftoneGL('images/leaf-on-the-wind-6col.jpg');
window.ht.prependTo(container);

var ht2 = new HalftoneGL('images/stillstrong.jpg');
ht2.prependTo(container);

var ht3 = new HalftoneGL('images/bird.jpg');
ht3.prependTo(container);

ht.setResolution(window.innerWidth / 3, window.innerHeight);
ht2.setResolution(window.innerWidth / 3, window.innerHeight);
ht3.setResolution(window.innerWidth / 3, window.innerHeight);
