import React, { FunctionComponent } from 'react'
import { Canvas } from 'react-three-fiber'

export default (({ children }) => (
  <Canvas>{children}</Canvas>
)) as FunctionComponent
