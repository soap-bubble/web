
export const basicVertexShader = `
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
uniform sampler2D texture;

void main() {
  float scale = 1.8;
  vec2 coord = (vUv.xy - 0.5) * scale + 0.5;
  coord.x = coord.x + (sin(coord.y * intensity + time) * amplitude);
  // coord.y = coord.y + (sin(coord.x * intensity / 25.0 + time) * amplitude);
  vec4 mapTexel = texture2D( texture, coord.xy );
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
