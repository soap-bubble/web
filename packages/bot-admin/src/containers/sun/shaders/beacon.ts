import { DoubleSide } from 'three'
import { Shader } from 'bot-admin/webgl/types'

const beacon: Shader = {
  uniforms: {
    texture: { value: null },
    border: { value: 0.05 },
    outterRadius: { value: 0.4 },
    color: { value: [0.0, 0.48, 1.0, 0.75] },
    center: { value: [0.5, 0.5] },
  },
  side: DoubleSide,
  transparent: true,
  vertexShader: `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vUv = uv;
  }
`,
  fragmentShader: `
    uniform float border; // 0.01
    uniform float outterRadius; // 0.5
    uniform vec4 color; // vec4(1.0, 1.0, 1.0, 1.0)
    uniform vec2 center; // vec2(0.5, 0.5)    
    varying vec2 vUv;
    void main (void)
    {
      vec2 uv = vUv;
      
      vec4 bkg_color = vec4(0.0);
      
      // Offset uv with the center of the circle.
      uv -= center;
      
      float dist =  sqrt(dot(uv, uv));
    
      float t = smoothstep(border * 1.5, border * 2.0, dist)
                + smoothstep(outterRadius + (border / 2.0), outterRadius + (border * 2.0), dist) 
                - smoothstep(outterRadius - (border * 2.0), outterRadius - (border / 2.0), dist);
    
      gl_FragColor = mix(color, bkg_color,t);
    }
`,
}

export default beacon
