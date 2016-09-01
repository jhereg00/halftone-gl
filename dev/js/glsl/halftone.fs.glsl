// halftone fragment shader
precision mediump float;

// uniforms
uniform vec4 uColor;

void main (void) {
  if (distance(gl_PointCoord,vec2(0.5,0.5)) > 0.499999)
    discard;
  gl_FragColor = uColor;
}
