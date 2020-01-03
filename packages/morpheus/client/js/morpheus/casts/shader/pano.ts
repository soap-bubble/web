import { BackSide, ShaderChunk } from 'three'

const pano: any = {
  uniforms: {
    texture1: { type: 't', value: null },
    texture2: { type: 't', value: null },
    rotation: { type: 'float', value: 0 },
  },
  vertexShader: `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vUv = uv;
  }
`,
  fragmentShader: `
  uniform lowp sampler2D texture1;
  uniform lowp sampler2D texture2;
  uniform lowp float rotation;
  varying vec2 vUv;
  #define PANO_CANVAS_WIDTH 3072.0
  #define PANO_CHUNK 620.0
  #define PANO_CHUNK_THIRD 1024.0 / 3072.0
  #define PANO_CHUNK_TWO_THIRDS 2048.0/3072.0

  ${ShaderChunk['common']}

  void main()
  {
      // vec2 rotOffset = vec2(0.5, 0.0);
      // rotation / PI2;
      vec2 rotvUv = vec2(mod(vUv.x + rotation / PI2, 1.0), vUv.y);
      vec2 offset = (1.0 - rotvUv); // + rotOffset; //mod(, 1.0);
      vec4 mapTexel;
      
      if (rotvUv.x <= PANO_CHUNK_THIRD) {
        mapTexel = vec4(0.0, 0.0, 0.0, 0.0);
        // vec2 primary = offset;
        // primary.x = PANO_CHUNK_THIRD - rotvUv.x;
        // primary.x /= PANO_CHUNK_THIRD;
        // // vec2 secondary = offset;
        // // secondary.x = rotvUv.x - PANO_CHUNK_THIRD;
        // // secondary.x /= PANO_CHUNK_TWO_THIRDS;
        // // secondary.x = 1.0 - secondary.x;
        // mapTexel = texture2D(texture2, clamp(primary, 0.0, 1.0));
        // // mapTexel = texture2D(texture2, clamp(primary, 0.0, 1.0));
        // // mapTexel = mix(texture2D(texture2, primary), texture2D(texture1, secondary), 0.0 + step(0.1, 1.0 - primary.x - secondary.x));
      } else {
        
        offset.x = rotvUv.x - PANO_CHUNK_THIRD;
        offset.x /= PANO_CHUNK_TWO_THIRDS;
        offset.x = 1.0 - offset.x;
        mapTexel = texture2D(texture1, offset);
        // mapTexel = texture2D(texture1, clamp(offset, 0.0, 1.0));
      }
      
      gl_FragColor = mapTexel;
  }
`,
  side: BackSide,
}

export default pano
