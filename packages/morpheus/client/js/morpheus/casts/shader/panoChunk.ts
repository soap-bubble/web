import { BackSide, ShaderChunk, Vector2 } from 'three'

const pano: any = {
  uniforms: {
    texture: { type: 't', value: null },
    offset: { type: 'float', value: 0 },
  },
  vertexShader: `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vUv = uv;
  }
`,
  fragmentShader: `
  uniform lowp sampler2D texture;
  uniform lowp float offset;
  varying vec2 vUv;

  #define border 0.001
  #define outterRadius 0.01

  ${ShaderChunk['common']}

  void main()
  {
      vec2 imgOffset = (1.0 - vUv);
      imgOffset *= (7.0 / 8.0);
      imgOffset.x += offset / 1024.0;
      gl_FragColor = texture2D(texture, imgOffset);

      // Draw a circle on the texture (for debug)
      // vec2 uv = vUv;
      // uv -= pointer;
      
      // float dist =  sqrt(dot(uv, uv));
    
      // float t = smoothstep(border * 1.5, border * 2.0, dist)
      //           + smoothstep(outterRadius + (border / 2.0), outterRadius + (border * 2.0), dist) 
      //           - smoothstep(outterRadius - (border * 2.0), outterRadius - (border / 2.0), dist);

      // gl_FragColor = mix(vec4(0.0, 0.0, 1.0, 1.0), texture2D(texture, imgOffset), t);
  }
`,
  side: BackSide,
}

export default pano
