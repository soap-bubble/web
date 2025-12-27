import { useCallback, useRef } from 'react'

export type RotationState = {
  x: number
  y: number
  offsetX: number
}

const defaultState: RotationState = {
  x: 0,
  y: 0,
  offsetX: 0,
}

const normalize = (value: number) =>
  Number.isFinite(value) ? value : 0

export default function useRotation(initialState: RotationState = defaultState) {
  const rotationRef = useRef<RotationState>({
    x: normalize(initialState.x),
    y: normalize(initialState.y),
    offsetX: normalize(initialState.offsetX),
  })

  const setRotation = useCallback((x: number, y: number) => {
    rotationRef.current = {
      ...rotationRef.current,
      x: normalize(x),
      y: normalize(y),
    }
  }, [])

  return {
    rotation: rotationRef.current,
    setRotation,
  }
}



