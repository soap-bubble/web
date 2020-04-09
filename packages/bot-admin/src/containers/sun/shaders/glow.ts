import { ShaderMaterialParameters } from 'three'
import { snoise4 } from './fragments'

// double calculateGlowSize(double diameter, double temperature, double distance) {
//   static const double DSUN = 1392684.0;
//   static const double TSUN = 5778.0;

//   // Georg's magic formula
//   double d = distance; // Distance
//   double D = diameter * DSUN;
//   double L = (D * D) * pow(temperature / TSUN, 4.0); // Luminosity
//   return 0.016 * pow(L, 0.25) / pow(d, 0.5); // Size
// }

const shader: ShaderMaterialParameters = {
  uniforms: {
    texture: { value: null },
    time: { value: 0 }
  },
  fragmentShader: `

uniform sampler2D texture;  
varying vec3 sPos;
varying vec2 vUv;
uniform float time;

${snoise4}

void main() {
  vec4 texColor = texture2D(texture, vUv);
  // Get the distance vector from the center
  vec3 nDistVec = normalize(cameraPosition);
  // Calculate brightness based on distance
  float dist = length(sPos) * 3.0;
  float brightness = (1.0 / (dist * dist) - 0.1) * 0.7;
  float spikeVal = snoise(vec4(nDistVec, time) * 15.5) + 0.2;

  float spikeBrightness = ((1.0 / pow(dist + 0.15, 0.5)) - 1.0);
  spikeBrightness = spikeBrightness * 0.2 * clamp(spikeVal, 0.0, 1.0);

  texColor.rgb += spikeBrightness;
  gl_FragColor = texColor;
}
`,
  vertexShader: `
varying vec3 sPos;
varying vec2 vUv;
uniform float scale;

void main() {
  sPos = position;
  vUv = uv;
  gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));
}
`
}

export default shader
