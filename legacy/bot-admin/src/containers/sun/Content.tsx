import React, { FunctionComponent } from 'react'

import Canvas from './Canvas'
import Beacon from './Beacon'
import Sun from './Sun'

const Content: FunctionComponent = () => {
  return (
    <Canvas>
      {/* <Beacon position={[2, 0, 0]} /> */}
      <Sun />
    </Canvas>
  )
}

export default Content
