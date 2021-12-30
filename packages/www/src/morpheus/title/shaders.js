
export const renderVertexShader = `
varying vec2 vUv;
void main()
{
  vUv = uv;
  gl_Position = vec4( position, 1.0 );
}
`;

export const basicVertexShader = `
varying vec2 vUv;
void main()
{
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const zWaveVertexShader = `
uniform float time;
varying vec2 vUv;
void main()
{
  vUv = uv;
  vec3 coord = position;
  coord.z = coord.z + (sin(coord.y * 30.0 + coord.x * 30.0 + time) * 0.025);
  vec4 mvPosition = modelViewMatrix * vec4( coord, 1.0 );

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const titleFragmentShader = `
varying vec2 vUv;
uniform float time;
uniform float amplitude;
uniform float intensity;
uniform float opacity;
uniform sampler2D tex;

void main() {
  float scale = 1.8;
  vec2 coord = (vUv.xy - 0.5) * scale + 0.5;
  coord.x = coord.x + (sin(coord.y * intensity + time) * amplitude);
  // coord.y = coord.y + (sin(coord.x * intensity / 25.0 + time) * amplitude);
  vec4 mapTexel = texture2D( tex, coord.xy );
  if (coord.x > 1.0
    || coord.x < 0.0
    || coord.y > 1.0
    || coord.y < 0.0) {
      gl_FragColor = vec4(0.0);
    } else {
      mapTexel.a *= opacity;
      gl_FragColor = mapTexel;
    }
}
`;

export const singleRippleVertexShader = `
uniform highp float time;
uniform highp float freq;
uniform lowp vec2 center;

varying vec2 vUv;

void main()
{
    vUv = uv;
    vec3 coord = position;
    highp vec2 p = 1.5 * (vUv-center);
    highp float len = length(p);
    coord.z = coord.z + len*freq*max(0.2, 2.0-len)*cos(len*24.0-time*5.0)*0.02;
    vec4 mvPosition = modelViewMatrix * vec4( coord, 1.0 );

    gl_Position = projectionMatrix * mvPosition;
}
`;


export const singleRippleFragmentShader = `
uniform lowp sampler2D texture;
uniform highp float time;
uniform float opacity;
uniform highp float freq;
uniform lowp vec2 center;

varying vec2 vUv;

void main()
{
    highp vec2 uv;
    highp vec2 p = 1.5 * (vUv-center);
    highp float len = length(p);
    uv = (p/len)*freq*max(0.2, 2.0-len)*cos(len*24.0-time*5.0)*0.02;
    vec4 mapTexel = texture2D(texture,vUv + uv);
    mapTexel.a *= opacity;
    gl_FragColor = mapTexel;
}
`;

export const rippleDissolveFragmentShader = `
uniform lowp sampler2D textureIn;
uniform lowp sampler2D textureOut;
uniform highp float time;
uniform float dissolve;
uniform highp float freq;
uniform lowp vec2 center;

varying vec2 vUv;

void main()
{
    highp vec2 uv;
    highp vec2 p = 1.5 * (vUv-center);
    highp float len = length(p);
    uv = (p/len)*freq*max(0.2, 2.0-len)*cos(len*24.0-time*5.0)*0.02;
    vec4 mapTexel = ((1.0 - dissolve) * texture2D(textureIn, vUv + uv))
      + (dissolve * texture2D(textureOut, vUv + uv));
    gl_FragColor = mapTexel;
}
`;

export const multiRippleFragmentShader = `
const int no = 5; //set how many splash-points you want

uniform lowp sampler2D tex;
uniform highp float time;
uniform float opacity;
uniform float fade;
uniform highp float freq[no];
uniform lowp vec2 center[no];

varying vec2 vUv;

void main()
{
    highp vec2 uv[no+1]; //array is 1 slot longer because...
    uv[no] = vec2(0.,0.); //last slot will hold the total (nb tables indexed from 0)
    for (int i=0; i<no; ++i) {
        highp vec2 p = 1.5 * (vUv-center[i]);
        highp float len = length(p);
        uv[i] = (p/len)*freq[i]*max(0.2, 2.0-len)*cos(len*24.0-time*5.0)*0.02;
        uv[no] += uv[i]; //tally total
    }
    vec4 mapTexel = texture2D(tex,vUv + uv[no]);
    mapTexel.rgb *= fade;
    mapTexel.a *= opacity;
    gl_FragColor = mapTexel;
}
`;
