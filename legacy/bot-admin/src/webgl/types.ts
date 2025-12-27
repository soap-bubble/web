import { Side, Shader as ThreeShader, Blending } from 'three'

export interface Shader {
  uniforms?: ThreeShader['uniforms']
  vertexShader?: string
  fragmentShader?: string
  lights?: boolean
  transparent?: boolean
  side?: Side
  blending?: Blending
}
