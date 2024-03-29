import React, { FunctionComponent } from 'react'
import { Color } from 'three'
import { Canvas } from 'react-three-fiber'
import canUseDom from 'bot-admin/utils/canUseDom'

const Stage: FunctionComponent = ({ children }) => {
  return (
    <Canvas
      pixelRatio={canUseDom ? window.devicePixelRatio : undefined}
      orthographic
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(new Color('#000000'), 0)
      }}
    >
      {children}
    </Canvas>
  )
}

export default Stage
