/**
 *  scripts.js
 *  This should include objects, which in turn include the lib files they need.
 *  This keeps us using a modular approach to dev while also only including the
 *  parts of the library we need.
 */

// temp way of doing this
window.HalftoneGL = require('app/HalftoneGL');
var container = document.querySelector('.container-global');
window.ht = new HalftoneGL('images/leaf-on-the-wind-6col.jpg');

window.hts = [
	ht.prependTo(container),
	new HalftoneGL('images/stillstrong.jpg').prependTo(container),
	new HalftoneGL('images/dotsize-goalie.jpg').prependTo(container),
	new HalftoneGL('images/dotsize-musician.jpg').prependTo(container),
	new HalftoneGL('images/bird.jpg').prependTo(container)
]
var time = 6000;

ht.animIn(time);
var active = 0;
document.body.addEventListener('click', function (e) {
	e.preventDefault();
	hts[active].animOut(time);
	window.setTimeout(function () {
		active = (active + 1) % hts.length;
		hts[active].animIn(time);
	}, time / 4);
})
