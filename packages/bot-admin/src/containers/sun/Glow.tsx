import React, { useMemo, FunctionComponent, useRef } from 'react'
import { TextureLoader, ShaderMaterial } from 'three'
import glowShader from './shaders/glow'
import { useFrame } from 'react-three-fiber'

const glowUrl = '/sun/star_glow.png'

const Glow: FunctionComponent = () => {
  const texture = useMemo(() => {
    const loader = new TextureLoader()
    delete loader.crossOrigin
    const texture = loader.load(glowUrl)
    return texture
  }, [])
  const shaderMaterial = useRef<ShaderMaterial>()
  useFrame(() => {
    if (shaderMaterial.current) {
      shaderMaterial.current.uniforms.time.value += 0.001
    }
  })
  return (
    <mesh position={[0, 0, 0]}>
      <planeBufferGeometry attach="geometry" args={[15, 15, 1, 1]} />
      <shaderMaterial
        ref={shaderMaterial}
        attach="material"
        args={[glowShader]}
        uniforms-texture-value={texture}
      />
    </mesh>
  )
}

export default Glow
