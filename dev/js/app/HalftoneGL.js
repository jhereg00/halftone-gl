/***
 *  HalftoneGL
 *
 *  A single instance of HalftoneGL for converting an image to a multilayered
 *  halftone using WebGL.  Creates a canvas, but doesn't actually put it anywhere.
 *
 *  @param {string} imageSrc - path to image file
 *
 *  @method appendTo - appends canvas to a `DOMElement`
 *    @param {DOMElement} target
 *  @method prependTo - makes canvas the first child of a `DOMElement`
 *    @param {DOMElement} target
 */
// requirements
var windowSize = require('lib/windowSize');
var GLShaders = require('lib/webgl/GLShaders');
var GLProgram = require('lib/webgl/GLProgram');
var GLBuffer = require('lib/webgl/GLBuffer');

// settings
var MIN_SIZE = 0;
var MAX_SIZE = 12; // diameter
var SPACING = 12;
var LT_COLOR = '#046C6F';
var MD_COLOR = '#003539';
var DK_COLOR = '#011c1f';

// helper
function makeTexture2d (gl, format, data) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, data);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	return texture;
}

// classes
var HalftoneGL = function (imageSrc) {
  this.imageSrc = imageSrc;
  // make a canvas
  this.canvas = document.createElement('canvas');
  this.canvas.setAttribute('class','halftone-gl');
  this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
  // ensure gl context was successful
  if (!this.gl) {
    console.error('failed to get WebGL context.');
    return false;
  }

  // 2D visuals, so minimal settings needed
  this.gl.clearColor(0.0,0.0,0.0,0.0);
  this.gl.clearDepth(1.0);
	this.gl.enable(this.gl.BLEND);
	this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

  // prep all the things
  this._loadShaders();
	this._makeSprites();

  // hey! listen!
  var _this = this;
  document.body.addEventListener('mousemove', function (e) {
    var xPerc = e.clientX / windowSize.width();
    var yPerc = e.clientY / windowSize.height();
    if (_this.texCan) {
      var ctx = _this.texCan.getContext('2d');
      var grad = ctx.createRadialGradient(
        // outer
        xPerc * _this.texCan.width, yPerc * _this.texCan.height, 500,
        // inner
        xPerc * _this.texCan.width, yPerc * _this.texCan.height, 50
      );
      grad.addColorStop(1,"rgba(255,255,255,0.1)");
      grad.addColorStop(0,"rgba(0,0,0,0.22)");
      _this._updateTexture();
      _this.draw();
    }
  });
}
HalftoneGL.prototype = {
  appendTo: function (target) {
    return target.appendChild(this.canvas);
  },
  prependTo: function (target) {
    if (!target.childNodes.length)
      return this.appendTo(target);

    return target.insertBefore(this.canvas, target.childNodes[0]);
  },

  setResolution: function (x, y) {
    this.resolution = [
      x || windowSize.width(),
      y || windowSize.height()
    ];
    this.canvas.width = this.resolution[0];
    this.canvas.height = this.resolution[1];
    this.gl.viewport(0, 0, this.resolution[0], this.resolution[1]);
    this._loadImage();
  },

  // internal
  _loadShaders: function () {
    var _this = this;

    GLShaders.loadAll(this.gl, [
      [this.gl.VERTEX_SHADER, 'halftoneVertex', 'js/glsl/halftone.vs.glsl'],
      [this.gl.FRAGMENT_SHADER, 'halftoneFragment', 'js/glsl/halftone.fs.glsl']
    ], function (success) {
      if (!success)
        throw 'Failed to load all shaders files.';
      _this._initPrograms();
    })
  },
	_makeSpriteCan: function (color) {
		var canvas = document.createElement('canvas');
		canvas.width = 32;
		canvas.height = 32;
		var ctx = canvas.getContext('2d');
		ctx.beginPath();
		ctx.arc(16,16,16,0, 2 * Math.PI);
		ctx.fillStyle = color || '#FFF';
		ctx.fill();
		return canvas;
	},
	_makeSprites: function () {
		this.spriteDkCanvas = this._makeSpriteCan(DK_COLOR);
		this.spriteDk = makeTexture2d(this.gl, this.gl.RGBA, this.spriteDkCanvas);

		this.spriteMdCanvas = this._makeSpriteCan(MD_COLOR);
		this.spriteMd = makeTexture2d(this.gl, this.gl.RGBA, this.spriteMdCanvas);

		this.spriteLtCanvas = this._makeSpriteCan(LT_COLOR);
		this.spriteLt = makeTexture2d(this.gl, this.gl.RGBA, this.spriteLtCanvas);
	},
  _loadImage: function () {
		var _this = this;
    this.texCan = document.createElement('canvas');
    this.texCan.width = 2048;
    this.texCan.height = 2048;
    var ctx = this.texCan.getContext('2d');
    // make the actual texture
    this.texture = makeTexture2d(this.gl, this.gl.RGBA, this.texCan);

    this.image = new Image();
    this.image.src = this.imageSrc;
		this.image.addEventListener('load', function () {
    	_this._updateTexture();
		});
  },
  /**
   *  pass a canvas fill style
   */
  _updateTexture: function (overlay) {
    // map resolution rectangle onto image
    var resScale = Math.min(
      this.image.width / this.resolution[0],
      this.image.height / this.resolution[1]
    );
    var resX = (this.image.width - (this.resolution[0] * resScale)) / 2;
    var resY = (this.image.height - (this.resolution[1] * resScale)) / 2;
    var ctx = this.texCan.getContext('2d');
    // draw mapped area of image to square canvas
    ctx.drawImage(
      this.image,
      resX,
      resY,
      resScale * this.resolution[0],
      resScale * this.resolution[1],
      0,
      0,
      this.texCan.width,
      this.texCan.height
    );

		if (overlay) {
			ctx.fillStyle = overlay;
			ctx.fillRect(0, 0, this.texCan.width, this.texCan.height);
		}
  },
  _initPrograms: function () {
    var _this = this;

    console.log('Initializing GL Programs');
    this.programs = {
      halftone: GLProgram.create(
        'halftone',
        this.gl,
        [
          GLShaders.get('halftoneVertex'),
          GLShaders.get('halftoneFragment')
        ],
        [
          'aPosition'
        ],
        [
          'uResolution',
          'uMinSize',
          'uMaxSize',
					'uZero',
					'uOne',
          'uImage',
          'uTexSize',
					'uPointSprite'
        ]
      )
    }

    this._makePoints();

    this.draw();
  },
  _makePoints: function () {
    // make our points
    if (!this.resolution) {
      this.setResolution();
    }

    // make array of 2d points
    var points = [];
    for (var row = 0; row < this.resolution[1] / SPACING + 1; row++) {
      for (var col = 0; col < this.resolution[0] / (SPACING / 2) + 1; col++) {
        // points = points.concat([
        //   col * (SPACING / 2),
        //   row * (SPACING) + (col % 2 * (SPACING / 2))
        // ]);
        points.push(col * (SPACING / 2));
        points.push(row * (SPACING) + (col % 2 * (SPACING / 2)));
      }
    }
    //console.log(points);

    this.buffers = {
      vertices: GLBuffer.create(this.gl, this.gl.ARRAY_BUFFER, 2)
    }

    this.points = points;
    this.buffers.vertices.bindData(points);
  },

  // do it!
  draw: function () {
    this.programs.halftone.use();
    var program = this.programs.halftone;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.buffers.vertices.bindToAttribute(program.attributes['aPosition']);

    // set uniforms
    this.gl.uniform2fv(program.uniforms.uResolution, this.resolution);
    this.gl.uniform1f(program.uniforms.uMinSize, MIN_SIZE);
    this.gl.uniform1f(program.uniforms.uMaxSize, MAX_SIZE);
    this.gl.uniform1i(program.uniforms.uTexSize, this.texCan.width);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.texCan);
    this.gl.uniform1i(program.uniforms.uImage, 1);

		// draw dk
		this.gl.uniform1f(program.uniforms.uZero, 0);
		this.gl.uniform1f(program.uniforms.uOne,0.25);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteDk);
		this.gl.uniform1i(program.uniforms.uPointSprite, 0);

    this.gl.drawArrays(this.gl.POINTS, 0, this.points.length / 2);

		// draw md
		this.gl.uniform1f(program.uniforms.uZero, 0.2);
		this.gl.uniform1f(program.uniforms.uOne,0.66);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteMd);
		this.gl.uniform1i(program.uniforms.uPointSprite, 0);

    this.gl.drawArrays(this.gl.POINTS, 0, this.points.length / 2);

		// draw lt
		this.gl.uniform1f(program.uniforms.uZero, 0.5);
		this.gl.uniform1f(program.uniforms.uOne,1);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteLt);
		this.gl.uniform1i(program.uniforms.uPointSprite, 0);

    this.gl.drawArrays(this.gl.POINTS, 0, this.points.length / 2);
  }
}

module.exports = HalftoneGL;
