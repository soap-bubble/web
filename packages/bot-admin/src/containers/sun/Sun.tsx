import React, { FunctionComponent, useRef, useMemo } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import coronaShader from './shaders/corona'
import { animated } from 'react-spring/three.cjs'
import { ShaderMaterial, TextureLoader, Color } from 'three'
import useMouseSpring from './useMouseSpring'
import Glow from './Glow'
import Flare from './LensFlare'

const flare1Url = '/ssr/sun/lens_flares_1.png'
const flare2Url = '/ssr/sun/lens_flares_2.png'
const Sun: FunctionComponent = () => {
  const shaderMaterial = useRef<ShaderMaterial>()
  const flare1Texture = useMemo(() => {
    const loader = new TextureLoader()
    delete loader.crossOrigin
    const texture = loader.load(flare1Url)
    return texture
  }, [])
  const flare2Texture = useMemo(() => {
    const loader = new TextureLoader()
    delete loader.crossOrigin
    const texture = loader.load(flare2Url)
    return texture
  }, [])
  const { camera } = useThree()
  const mousePosition = useMouseSpring([1, 1, -15])
  useFrame(() => {
    if (shaderMaterial.current) {
      shaderMaterial.current.uniforms.time.value += 0.0022
    }
  })
  return (
    <>
      <animated.mesh position={mousePosition}>
        <sphereGeometry args={[6, 8, 8]} attach="geometry" />
        <shaderMaterial ref={shaderMaterial} args={[coronaShader]} attach="material" uniforms-scale-value={4.0} />
        <Flare
          position={mousePosition}
          elements={[
            {
              texture: flare1Texture,
              size: 64,
              distance: 0
            },
            {
              texture: flare1Texture,
              size: 64,
              distance: 1.2
            },
            {
              texture: flare2Texture,
              size: 38,
              distance: 0.2,
              color: new Color(0x0000ff)
            },
            {
              texture: flare2Texture,
              size: 40,
              distance: 0.3,
              color: new Color(0x000ff0)
            },
            {
              texture: flare2Texture,
              size: 44,
              distance: 0.4,
              color: new Color(0x00ff00)
            },
            {
              texture: flare2Texture,
              size: 56,
              distance: 0.5,
              color: new Color(0x0ff000)
            },
            {
              texture: flare2Texture,
              size: 69,
              distance: 0.7,
              color: new Color(0x0ff000)
            },
            {
              texture: flare2Texture,
              size: 64,
              distance: 0.9,
              color: new Color(0xff0000)
            }
          ]}
        />
        <Glow />
      </animated.mesh>
    </>
  )
}

export default Sun
