import React, { useRef, useEffect, FunctionComponent } from 'react'
import { Mesh } from 'three'

import beaconShader from './shaders/beacon'

const Beacon: FunctionComponent<{
  position: [number, number, number]
  size?: number
  lookAt?: [number, number, number]
}> = ({ position, lookAt, size = 0.01 }) => {
  const meshRef = useRef<Mesh>()
  useEffect(() => {
    if (meshRef.current && lookAt) {
      meshRef.current.lookAt(...lookAt)
    }
  }, [meshRef.current, lookAt])

  return (
    <mesh ref={meshRef} scale={[size, size, size]} up={[0, 0, 1]} position={position}>
      <planeBufferGeometry attach="geometry" args={[40, 40, 1, 1]} />
      <shaderMaterial args={[beaconShader]} attach="material" />
    </mesh>
  )
}

export default Beacon
