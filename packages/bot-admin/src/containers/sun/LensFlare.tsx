import React, {
  FunctionComponent,
  useMemo,
  useEffect,
  MutableRefObject,
  useRef,
} from 'react'
import { animated } from 'react-spring/three.cjs'
import { Lensflare, LensflareElement } from './lensFlareExample'
import { Color, Texture, SpotLight } from 'three'
import { extend } from 'react-three-fiber'

extend({
  Lensflare,
})

export interface FlareElement {
  color: Color
  texture: Texture
  size: number
  distance: number
}

const LensFlare: FunctionComponent<{
  elements: Partial<FlareElement>[]
  position: any
}> = ({ elements, position }) => {
  const lensflareRef = useRef<Lensflare>()
  const lightRef = useRef<SpotLight>()
  useEffect(() => {
    if (lensflareRef.current) {
      lensflareRef.current.elements = []
      elements.forEach(
        ({ color, distance, texture, size }) =>
          lensflareRef.current &&
          lensflareRef.current.addElement(
            new LensflareElement(texture, size, distance, color)
          )
      )
    }
  }, [elements, lensflareRef.current])
  return (
    <animated.spotLight
      ref={lightRef}
      position={position}
      args={[new Color(0xffffff), 4]}
    >
      <lensflare ref={lensflareRef} />
    </animated.spotLight>
  )
}
export default LensFlare
