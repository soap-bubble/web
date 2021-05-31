import React, { FunctionComponent } from 'react'
import store from './store'
import {
  Texture,
  TextureLoader,
  DoubleSide,
  NearestFilter,
  ShaderMaterial,
} from 'three'
import { animated, apply, useSpring } from 'react-spring/three.cjs'
import { useMemo } from 'react'
import emojiShader from './shaders/emoji'
import { extend } from 'react-three-fiber'

class EmojiShaderMaterial extends ShaderMaterial {
  constructor() {
    super({
      ...emojiShader,
      uniforms: {
        ...emojiShader.uniforms,
        texture: {
          ...emojiShader.uniforms.texture,
        },
        alpha: {
          ...emojiShader.uniforms.texture,
        },
      },
    })
  }

  get texture() {
    return this.uniforms.texture.value
  }
  set texture(v) {
    this.uniforms.texture.value = v
  }

  get alpha() {
    return this.uniforms.alpha.value
  }
  set alpha(v) {
    this.uniforms.alpha.value = v
  }
}

;[apply, extend].forEach(func =>
  func({
    EmojiShaderMaterial,
  })
)

const TwitchEmoji: FunctionComponent<{
  id: number
  alpha: number
  pos: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}> = ({ id, alpha, pos, scale, rotation }) => {
  const {
    images: { width, height, url },
  } = useMemo(() => store(id), [id])

  const texture = useMemo(() => {
    const loader = new TextureLoader()
    delete loader.crossOrigin
    const texture = loader.load(url)
    texture.minFilter = NearestFilter
    texture.magFilter = NearestFilter
    return texture
  }, [])

  return (
    <animated.mesh position={pos} scale={scale} rotation={rotation}>
      <planeBufferGeometry attach="geometry" args={[1, 1, 1, 1]} />
      <animated.emojiShaderMaterial
        attach="material"
        texture={texture}
        alpha={alpha}
        transparent
      />
    </animated.mesh>
  )
}

export default TwitchEmoji
