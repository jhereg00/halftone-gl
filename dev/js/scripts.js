/**
 *  scripts.js
 *  This should include objects, which in turn include the lib files they need.
 *  This keeps us using a modular approach to dev while also only including the
 *  parts of the library we need.
 */

// temp way of doing this
var HalftoneGL = require('app/HalftoneGL');
var container = document.querySelector('.container-global');
window.ht = new HalftoneGL();

window.ht.prependTo(container);
