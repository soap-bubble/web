import wagner from 'wagner-core';

export function colorFragment(r, g, b, a) {
  function numberAsFloat(n) {
    return Number.isInteger(n) ? `${n}.0` : `${n}`;
  }
  const vec4 = `${numberAsFloat(r)}, ${numberAsFloat(g)}, ${numberAsFloat(b)}, ${numberAsFloat(a)}`


  return `
precision mediump float;

void main(void) {
  gl_FragColor = vec4(${vec4})
}
`
}

export const passThrough = {
  fragment: `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`
,  vertex: `
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  vTextureCoord = aTextureCoord;
}
`
}

export const spherical = {
  fragment: passThrough.fragment,
  vertex: `
attribute vec2 aPlanePosition;
attribute vec2 aPlaneTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;

void main(void) {
  vec3 sherical;
  float q = aPlanePosition.x;
  float f = aPlanePosition.y;

  sherical.x = 5.0 * sin(f) * cos(q);
  sherical.y = 5.0 * sin(f) * sin(q);
  sherical.z = 5.0 * cos(f);

  gl_Position = uPMatrix * uMVMatrix * vec4(sherical, 1.0);
  vTextureCoord = aPlaneTextureCoord;
}
`
}

wagner.factory('shaders', () => {
  return {
    passThrough,
    spherical,
    colorFragment
  };
});