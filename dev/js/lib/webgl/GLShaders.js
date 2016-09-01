/**
 *  Namespace for loading and storing WebGL shaders
 */
// requirements
var AjaxRequest = require('lib/AjaxRequest');

// settings

// storage
var loadedShaders = {};

// important functions
/***
 *  loadFileContents
 *
 *  loads a file's source
 *
 *  @param {string} path
 *  @param {function} callback - fires on complete
 *  @param {boolean} bustCache - whether to add a cache busting param
 */
var loadFileContents = function (path, cb, bustCache) {
  return new AjaxRequest (bustCache ? path + '?cache=' + new Date().getTime() : path, {
    complete: cb
  });
}

/***
 *  loadAndInitShader
 *
 *  loads a shader from a file, then initializes it
 *
 *  @param {WebGLContext} gl
 *  @param {int} WebGL - Shader type (use the enum), gl.VERTEX_SHADER || gl.FRAGMENT_SHADER
 *  @param {string} shader name
 *  @param {string} shader file path
 *  @param {function} callback
 */
var loadAndInitShader = function (gl, type, name, path, cb) {
  return loadFileContents (path, function (responseText, xhttp) {
    if (/^(2|3)/.test(xhttp.status.toString()) && responseText) {
      // got something
      var shader = gl.createShader(type);
      gl.shaderSource(shader, responseText);
      gl.compileShader(shader);
      // any errors?
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("An error occurred compiling the shaders (" + name + "): \n" + gl.getShaderInfoLog(shader));
      }
      loadedShaders[name] = shader;
      if (cb && typeof cb === 'function')
        cb(shader);
    }
    else if (cb && typeof cb === 'function') {
      console.error("An error occurred loading the shaders: " + name);
      cb(null);
    }
  });
}

/***
 *  loadAll
 *
 *  loads a bunch of shaders at once
 *
 *  @param {WebGLContext} gl
 *  @param {2DArray} list - Array of Arrays with `[type, name, path]`
 *  @param {function} callback
 *    @param {boolean} success
 */
var loadAll = function (gl, toLoad, cb) {
  var success = true; // assume we'll succeed until proven otherwise
  var requests = [];
  var checkDone = function (shader) {
    if (!shader)
      success = false;

    for (var i = 0, len = requests.length; i < len; i++) {
      if (requests[i].getReadyState() !== AjaxRequest.readyState.DONE) {
        return false;
      }
    }
    // done, so call our callback
    cb (success);

    return true;
  }

  // make the calls
  for (var j = 0, len = toLoad.length; j < len; j++) {
    requests.push(loadAndInitShader(gl, toLoad[j][0], toLoad[j][1], toLoad[j][2], checkDone));
  }
}

/***
 *  getShader
 *
 *  gets an already loaded shader
 *
 *  @param {string} name
 */
var getShader = function (name) {
  return loadedShaders[name];
}

module.exports = {
  loadAndInitShader: loadAndInitShader,
  loadAndInit: loadAndInitShader,
  loadAll: loadAll,
  getShader: getShader,
  get: getShader
}
