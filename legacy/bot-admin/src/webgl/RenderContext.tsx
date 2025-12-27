import React, { useRef, useCallback, createContext, useEffect } from 'react'
import { useFrame, useThree } from 'react-three-fiber'

interface iRenderContext {
  invalidate: () => void
  renderNextFrame: React.MutableRefObject<boolean> | undefined
}

const defaultContext: iRenderContext = {
  invalidate: () => null,
  renderNextFrame: undefined
}

const RenderContext = createContext(defaultContext)

const RenderProvider: React.FC<{ name?: string }> = ({ name, children }) => {
  const renderNextFrame = useRef(true)
  const { viewport } = useThree()

  const invalidate = useCallback(() => {
    renderNextFrame.current = true
  }, [renderNextFrame])

  const state: iRenderContext = { invalidate, renderNextFrame }

  useFrame(({ gl, scene, camera }) => {
    if (renderNextFrame.current) {
      gl.render(scene, camera)
      renderNextFrame.current = false
    }
  }, 1)

  useEffect(() => {
    invalidate()
  }, [viewport])

  return <RenderContext.Provider value={state}>{children}</RenderContext.Provider>
}

export { RenderProvider, RenderContext }
