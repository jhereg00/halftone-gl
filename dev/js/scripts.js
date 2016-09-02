/**
 *  scripts.js
 *  This should include objects, which in turn include the lib files they need.
 *  This keeps us using a modular approach to dev while also only including the
 *  parts of the library we need.
 */

// temp way of doing this
var HalftoneGL = require('app/HalftoneGL');
var container = document.querySelector('.container-global');
window.ht = new HalftoneGL('images/bird.jpg');

window.ht.prependTo(container);

// debug
window.setTimeout(function () {
  //document.body.appendChild(window.ht.texCan);
  window.ht.texCan.style.position = "fixed";
  window.ht.texCan.style.top = "0";
  window.ht.texCan.style.left = "0";
  window.ht.texCan.style.width = window.innerWidth + 'px';
  window.ht.texCan.style.height = window.innerHeight + 'px';
  window.ht.texCan.style.opacity = '.2';
}, 3000);
