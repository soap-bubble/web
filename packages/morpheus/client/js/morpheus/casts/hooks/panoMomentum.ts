import { PointerEvent, useMemo, useState, useCallback } from 'react'
import useRaf from '@rooks/use-raf'
import { last } from 'lodash'
import { PointerEvents } from 'morpheus/hotspot/eventInterface'

interface Position {
  top: number
  left: number
  time: number
  vertical?: number
  horizontal?: number
}

const DEG_TO_RAD = Math.PI / 180
const MAX_MOMENTUM = 0.0125 * DEG_TO_RAD
const DAMPER = 0.9
const RAD_TO_MORPHEUS_TEXTURE = 3072 / (Math.PI * 2)
const UP_DOWN_LIMIT = 5.3 * (Math.PI / 180)

const clampNumber = (num: number, a: number, b: number) =>
  Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b))

const step = (num: number, max: number) => {
  if (num > max) {
    return num - max
  } else if (num < 0) {
    return num + max
  }
  return num
}

function clampRotation(
  rotation: { x: number; y: number },
  delta: { x: number; y: number }
) {
  let newRotationX = rotation.x - delta.y
  const newRotationY = clampNumber(
    rotation.y + (delta.x * Math.PI) / 720,
    -UP_DOWN_LIMIT,
    UP_DOWN_LIMIT
  )
  const chunk = Math.floor((rotation.x % 3072) / 24) * 24
  return {
    x: step(newRotationX, 3072),
    y: newRotationY,
    offsetX: chunk,
  }
}

function convertFromHorizontalSpeed(delta: number, sensitivity: number) {
  const speed = (delta * DEG_TO_RAD) / (20 * ((19 - sensitivity) / 18.0))
  return speed
}

function convertFromVerticalSpeed(delta: number, sensitivity: number) {
  return (delta * DEG_TO_RAD) / (40 * ((19 - sensitivity) / 18.0))
}

type PanoHandler = [
  { x: number; y: number; offsetX: number },
  PointerEvents<HTMLCanvasElement>
]

export default function(
  sensitivity: number,
  interactionDebounce: number
): PanoHandler {
  // Here an interaction is a user touch gesture or a pointer movement with mouse clicked
  const [rotation, setRotation] = useState({
    x: 0,
    y: 0,
    offsetX: 0,
  })

  // If we are in a user interaction
  const [active, setActive] = useState(false)
  // All positions for this interaction event
  const [positions, setPositions] = useState([] as Position[])
  // The start of an interaction position
  const [startPos, setStartPos] = useState<Position>()

  // Momentum is a sense of continued be deaccelerating user interaction that continues
  // after the user event ends
  const [momentumAbort, setMomentumAbort] = useState(false)
  const [momentumEnabled, setMomentumEnabled] = useState(false)
  const [momentumSpeed, setMomentumSpeed] = useState({ x: 0, y: 0 })

  useRaf(() => {
    if (!momentumAbort) {
      let yFine = false
      const speed = { ...momentumSpeed }
      if (momentumSpeed.y > MAX_MOMENTUM || momentumSpeed.y < -MAX_MOMENTUM) {
        speed.y *= DAMPER
      } else {
        speed.y = 0
        yFine = true
      }

      if (momentumSpeed.x > MAX_MOMENTUM || momentumSpeed.x < -MAX_MOMENTUM) {
        speed.x *= DAMPER
      } else if (yFine) {
        speed.x = 0
        setMomentumEnabled(false)
      }
      setRotation(clampRotation(rotation, speed))
      setMomentumSpeed(speed)
    }
    setMomentumAbort(false)
  }, momentumEnabled)

  const startMomentum = useCallback(
    function startMomentum() {
      if (!momentumEnabled) {
        setMomentumEnabled(true)
      }
    },
    [momentumEnabled, setMomentumEnabled]
  )

  const onPointerDown = useCallback(
    function onInteractionStart({
      clientX: left,
      clientY: top,
    }: PointerEvent<HTMLCanvasElement>) {
      const now = Date.now()
      const start = { top, left, time: now }
      setActive(true)
      setPositions([start])
      setStartPos(start)
      setMomentumAbort(true)
    },
    [setActive, setPositions, setStartPos, setMomentumAbort]
  )

  const onPointerMove = useCallback(
    function onInteractionMove({
      clientX: left,
      clientY: top,
    }: PointerEvent<HTMLCanvasElement>) {
      if (active) {
        const interactionLastPos = last(positions)
        if (interactionLastPos) {
          const newPositions = [...positions]
          const speed = {
            horizontal: left - interactionLastPos.left,
            vertical: top - interactionLastPos.top,
          }
          const delta = {
            y: convertFromHorizontalSpeed(speed.horizontal, sensitivity),
            x: convertFromVerticalSpeed(speed.vertical, sensitivity),
          }
          const time = Date.now()
          if (!positions.length || interactionLastPos.time !== time) {
            newPositions.push({ time: Date.now(), left, top, ...delta })
          }
          if (newPositions.length > 5) {
            newPositions.shift()
          }
          delta.x *= RAD_TO_MORPHEUS_TEXTURE
          delta.y *= RAD_TO_MORPHEUS_TEXTURE
          setPositions(newPositions)
          setRotation(clampRotation(rotation, delta))
        }
      }
    },
    [positions, setPositions, rotation, setRotation, active]
  )

  const onPointerUp = useCallback(
    function onInteractionEnd({
      clientX: left,
      clientY: top,
    }: PointerEvent<HTMLCanvasElement>) {
      if (startPos) {
        const interactionDistance = Math.sqrt(
          (startPos.left - left) ** 2 + (startPos.top - top) ** 2
        )
        if (interactionDistance > interactionDebounce) {
          const lastPosition = last(positions)
          if (
            lastPosition &&
            lastPosition.vertical &&
            lastPosition.horizontal
          ) {
            setMomentumSpeed({
              x: lastPosition.vertical,
              y: lastPosition.horizontal,
            })
          }
          startMomentum()
        }
      }
      setActive(false)
    },
    [startPos, positions, setMomentumSpeed, startMomentum]
  )

  const pointerEvents = useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerOut: onPointerUp,
      onPointerLeave: onPointerUp,
    }),
    [onPointerUp, onPointerDown, onPointerMove]
  )

  return [rotation, pointerEvents]
}
