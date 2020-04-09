import { ShaderMaterialParameters } from 'three'
import { snoise4 } from './fragments'

const shader: ShaderMaterialParameters = {
  uniforms: {
    scale: { value: 0.1 }, //  will set later
    temp: { value: 3050 },
    time: { value: 0 }
  },
  transparent: true,
  depthWrite: false,
  fragmentShader: `
varying vec3 sPos;
uniform float scale;
uniform float time;
uniform float temp;
${snoise4}

int OCTAVES = 4;

float noise(vec4 position, float frequency, float persistence) {
  float total = 0.0; // Total value so far
  float maxAmplitude = 0.0; // Accumulates highest theoretical amplitude
  float amplitude = 1.0;

  // UNROLLED 4 OCTAVES
  
  // OCTAVE 1

  // Get the noise sample
  total += snoise(position * frequency) * amplitude;

  // Make the wavelength twice as small
  frequency *= 2.0;

  // Add to our maximum possible amplitude
  maxAmplitude += amplitude;

  // Reduce amplitude according to persistence for the next octave
  amplitude *= persistence;

  // OCTAVE 2

  // Get the noise sample
  total += snoise(position * frequency) * amplitude;

  // Make the wavelength twice as small
  frequency *= 2.0;

  // Add to our maximum possible amplitude
  maxAmplitude += amplitude;

  // Reduce amplitude according to persistence for the next octave
  amplitude *= persistence;

  // OCTAVE 3

  // Get the noise sample
  total += snoise(position * frequency) * amplitude;

  // Make the wavelength twice as small
  frequency *= 2.0;

  // Add to our maximum possible amplitude
  maxAmplitude += amplitude;

  // Reduce amplitude according to persistence for the next octave
  amplitude *= persistence;

  // OCTAVE 4
  // Get the noise sample
  total += snoise(position * frequency) * amplitude;

  // Make the wavelength twice as small
  frequency *= 2.0;

  // Add to our maximum possible amplitude
  maxAmplitude += amplitude;

  // Reduce amplitude according to persistence for the next octave
  amplitude *= persistence;

  // Scale the result by the maximum amplitude
  return total / maxAmplitude;
}

void main() {

  // vec3 nDistVec = normalize(sPos);

  float dist1 = sqrt(pow(sPos.x, 2.0) + pow(sPos.y, 2.0));
  float scaleDist = dist1/scale;
  // float noise2 = abs(.01/(abs(nDistVec.y)+.05)) * 2.3;
  float noise2 = noise(vec4(sPos.x, sPos.y, sPos.z, time), 3.0, 0.7);
  float fade = 1.0 - 3.0*dist1/scale;
  float totalStrength = fade*(1.0 + noise2 );

  float i =(temp - 800.0)*0.035068;

  //  these equations reproduce the RGB values of this image: https://www.seedofandromeda.com/assets/images/blogs/star_spectrum_3.png

  //  for R
  bool rbucket1 = i < 60.0;   //  0, 255 in 60
  bool rbucket2 = i >= 60.0 && i < 236.0;  //   255,255
  bool rbucket3 = i >= 236.0 && i < 288.0; //  255,128
  bool rbucket4 = i >= 288.0 && i < 377.0; //  128,60
  bool rbucket5 = i >= 377.0 && i < 511.0; //  60,0
  bool rbucket6 = i >= 511.0;  //  0,0

  bool gbucket1 = i <60.0;
  bool gbucket2 = i >= 60.0 && i < 103.0; //  0,100
  bool gbucket3 = i >= 103.0 && i < 133.0; // 100,233
  bool gbucket4 = i >= 133.0 && i < 174.0; // 233, 255
  bool gbucket5 = i >= 174.0 && i < 236.0; // 255,255
  bool gbucket6 = i >= 236.0 && i < 286.0; //255,193
  bool gbucket7 = i >= 286.0 && i < 367.0; //193,129
  bool gbucket8 = i >= 367.0 && i < 511.0; //129,64
  bool gbucket9 = i >= 511.0; // 64,32

  // for B
  bool bbucket1 = i < 103.0;
  bool bbucket2 = i >= 103.0 && i < 133.0; // 0,211
  bool bbucket3 = i >= 133.0 && i < 173.0; // 211,247
  bool bbucket4 = i >= 173.0 && i < 231.0;  //  247,255
  bool bbucket5 = i>= 231.0;

  float cr =
    float(rbucket1) * (0.0 + i * 4.25) +
    float(rbucket2) * (255.0) +
    float(rbucket3) * (255.0 + (i - 236.0) * -2.442) +
    float(rbucket4) * (128.0 + (i - 288.0) * -0.764) +
    float(rbucket5) * (60.0 + (i - 377.0) * -0.4477)+
    float(rbucket6) * 0.0;

  float cg =
      float(gbucket1) * (0.0) +
      float(gbucket2) * (0.0 + (i - 60.0) *2.3255) +
      float(gbucket3) * (100.0 + (i - 103.0) *4.433)+
      float(gbucket4) * (233.0 + (i - 133.0) *0.53658)+
      float(gbucket5) * (255.0) +
      float(gbucket6) * (255.0 +(i - 236.0) *-1.24) +
      float(gbucket7) * (193.0 + (i - 286.0) *-0.7901) +
      float(gbucket8) * (129.0 + (i - 367.0) * -0.45138)+
      float(gbucket9) * (64.0 + (i - 511.0) * -0.06237);

  float cb =
    float(bbucket1) * 0.0+
    float(bbucket2) * (0.0 + (i - 103.0) * 7.0333) +
    float(bbucket3) * (211.0 + (i - 133.0) * 0.9)+
    float(bbucket4) * (247.0 + (i - 173.0)*0.1379)+
    float(bbucket5) * 255.0;

  float intense = .8*totalStrength;

  // vec4 position = vec4(cameraPosition, time);

  // float n = (noise(position, 40.0, 0.7) + 1.0) * 0.5;
  
  // float total = n;
  // vec4 pColor = vec4(total, total, total, 1.0);
  
  // Calculate brightness based on distance

  // Get the distance vector from the center
  vec3 nDistVec = normalize(cameraPosition);

  // Get noise with normalized position to offset the original position
  vec3 position = cameraPosition + noise(vec4(nDistVec, time), 3.0, 0.7) * 0.5;

  // Calculate brightness based on distance
  float dist = length(position) * 3.0;
  float brightness = (1.0 / (dist * dist) - 0.1) * 0.7;
  float spikeVal = snoise(vec4(nDistVec, time) * 15.5) + 0.2;

  float spikeBrightness = ((1.0 / pow(dist + 0.15, 0.5)) - 1.0);
  spikeBrightness = spikeBrightness * 0.02 * clamp(spikeVal, 0.0, 1.0);

  gl_FragColor = vec4(cr, cg, cb, 1.0) * totalStrength + intense + brightness;
  // gl_FragColor.r = cr * totalStrength + intense + brightness;
  // gl_FragColor.g = cg * totalStrength + intense + brightness;
  // gl_FragColor.b = cb * totalStrength + intense + brightness;
  gl_FragColor.a = totalStrength - 0.1 * dist / scale;
}  
`,
  vertexShader: `
varying vec3 sPos;
uniform float scale;

void main() {
  sPos = position;
  gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));
}
`
}

export default shader
