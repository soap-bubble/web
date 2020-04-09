import { useCallback, useEffect, useState } from 'react'
import { useSpring } from 'react-spring/three.cjs'
import { useThree } from 'react-three-fiber'
import { visibleWidthAtZDepth, visibleHeightAtZDepth } from '@branes/www/webgl/transforms'
import { PerspectiveCamera } from 'three'

export default (start: [number, number, number]) => {
  const { camera } = useThree()
  const [position, setPosition] = useState(start)
  const mouse = useSpring({
    pos: position,
    config: { mass: 10, tension: 1000, friction: 300, precision: 0.00001 }
  })
  const {
    size: { width, height }
  } = useThree()
  const onMouseMove = useCallback(
    evt => {
      setPosition([
        ((evt.clientX - (width || 1) / 2) / width) * visibleWidthAtZDepth(start[2], camera as PerspectiveCamera),
        (-(evt.clientY - (height || 1) / 2) / height) * visibleHeightAtZDepth(start[2], camera as PerspectiveCamera),
        start[2]
      ])
    },
    [width, height]
  )
  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [onMouseMove])
  return mouse.pos
}
