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
var MAX_SIZE = 16; // diameter
var SPACING = 16;
var COLOR = [
  parseInt('04',16) / 255,
  parseInt('6C',16) / 255,
  parseInt('6F',16) / 255,
  1.0];

// classes
var HalftoneGL = function (imageSrc) {
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

  // prep all the things
  this._loadShaders();

  // hey! listen!
  var _this = this;
  document.body.addEventListener('mousemove', function (e) {
    var xPerc = e.clientX / windowSize.width();
    var yPerc = e.clientY / windowSize.height();
    if (_this.texCan) {
      var ctx = _this.texCan.getContext('2d');
      var cxlg = ctx.createRadialGradient(
        // outer
        _this.texCan.width / 2, _this.texCan.height / 2, Math.max(_this.texCan.width, _this.texCan.height) / 2,
        // inner
        xPerc * _this.texCan.width, _this.texCan.height - yPerc * _this.texCan.height, 200
      );
      cxlg.addColorStop(1,"white");
      cxlg.addColorStop(0,"black");
      // cxlg.addColorStop(.66,"#07A961");
      ctx.fillStyle = cxlg;
      ctx.fillRect(0,0,_this.texCan.width,_this.texCan.height);
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
  _loadImage: function () {
    this.texCan = document.createElement('canvas');
    this.texCan.width = 1024;
    this.texCan.height = 1024;
    var ctx = this.texCan.getContext('2d');
    var cxlg=ctx.createLinearGradient(0, 0, this.texCan.width, 0);
    cxlg.addColorStop(0, '#f00');
    cxlg.addColorStop(0.5, '#0f0');
    cxlg.addColorStop(1.0, '#00f');
    ctx.fillStyle = cxlg;
    ctx.fillRect(0,0,this.texCan.width,this.texCan.height);
    // add image and fit size

    // make the actual texture
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.texCan);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
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
          'uColor',
          'uImage'
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
    this.gl.uniform4fv(program.uniforms.uColor, new Float32Array(COLOR));

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.texCan);
    this.gl.uniform1i(program.uniforms.uImage, 0);

    this.gl.drawArrays(this.gl.POINTS, 0, this.points.length / 2);
  }
}

module.exports = HalftoneGL;
