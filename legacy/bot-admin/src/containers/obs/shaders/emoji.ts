import { ShaderMaterialParameters, DoubleSide } from 'three'

const shader: ShaderMaterialParameters = {
  side: DoubleSide,
  uniforms: {
    texture: { value: null },
    alpha: { value: 1 },
  },
  fragmentShader: `

varying vec2 vUv;
uniform sampler2D texture;  
uniform float alpha;

void main() {
  vec4 texColor = texture2D(texture, vUv);
  if(texColor.a - 0.5 < 0.0) {
    texColor.a = 0.0;
}
  texColor.a *= alpha;
  gl_FragColor = texColor;
}
`,
  vertexShader: `
varying vec2 vUv;

void main() {
  vUv = uv;
	vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * modelViewPosition;
}
`,
}

export default shader
