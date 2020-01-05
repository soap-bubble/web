import { useEffect, useMemo, useState, useCallback } from 'react'
import useRaf from '@rooks/use-raf'
import { last } from 'lodash';

interface Position {
  top: number
  left: number
  time: number
  vertical?: number
  horizontal?: number
}

const DEG_TO_RAD = Math.PI / 180;
const MAX_MOMENTUM = 0.0125 * DEG_TO_RAD;
const DAMPER = 0.90;
const RAD_TO_MORPHEUS_TEXTURE = 3072 / (Math.PI * 2)

function convertFromHorizontalSpeed(delta: number, sensitivity: number) {
  const speed = (delta * DEG_TO_RAD) / (20 * ((19 - sensitivity) / 18.0));
  return speed;
}

function convertFromVerticalSpeed(delta: number, sensitivity: number) {
  return (delta * DEG_TO_RAD) / (40 * ((19 - sensitivity) / 18.0));
}

export default function (sensitivity: number, interactionDebounce: number) {
  // Here an interaction is a user touch gesture or a pointer movement with mouse clicked
  
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

  const [delta, setDelta] = useState({ x: 0, y: 0})

  useMemo(() => {
  }, [active, positions, startPos, momentumAbort, momentumEnabled, momentumSpeed, delta])

  useRaf(() => {
    if (!momentumAbort) {
      let yFine = false;
      const speed = { ...momentumSpeed }
      if (momentumSpeed.y > MAX_MOMENTUM || momentumSpeed.y < -MAX_MOMENTUM) {
        speed.y *= DAMPER;
      } else {
        speed.y = 0;
        yFine = true;
      }

      if (momentumSpeed.x > MAX_MOMENTUM || momentumSpeed.x < -MAX_MOMENTUM) {
        speed.x *= DAMPER;
      } else if (yFine) {
        speed.x = 0;
        setMomentumEnabled(false)
      }
      setDelta(speed)
      setMomentumSpeed(speed)
    }
    setMomentumAbort(false)
  }, momentumEnabled)

  const startMomentum = useCallback(function startMomentum() {
    if (!momentumEnabled) {
      setMomentumEnabled(true)
    }
  }, [momentumEnabled, setMomentumEnabled])

  const onPointerDown = useCallback(function onInteractionStart({ clientX: left, clientY: top }: PointerEvent) {
    const now = Date.now()
    const start = { top, left, time: now }
    setActive(true);
    setPositions([start]);
    setStartPos(start)
    setMomentumAbort(true)
  }, [setActive, setPositions, setStartPos, setMomentumAbort])

  const onPointerMove = useCallback(function onInteractionMove({ clientX: left, clientY: top }: PointerEvent) {
    if (active) {
      const interactionLastPos = last(positions);
      if (interactionLastPos) {
        const newPositions = [...positions]
        const speed = {
          horizontal: left - interactionLastPos.left,
          vertical: top - interactionLastPos.top,
        };
        const delta = {
          horizontal: convertFromHorizontalSpeed(speed.horizontal, sensitivity),
          vertical: convertFromVerticalSpeed(speed.vertical, sensitivity),
        };
        const time = Date.now();
        if (!positions.length || interactionLastPos.time !== time) {
          newPositions.push({ time: Date.now(), left, top, ...delta });
        }
        if (newPositions.length > 5) {
          newPositions.shift();
        }
        setPositions(newPositions)
        setDelta({
          x: delta.vertical * RAD_TO_MORPHEUS_TEXTURE,
          y: delta.horizontal * RAD_TO_MORPHEUS_TEXTURE,
        })
      }
    }
  }, [positions, setPositions, setDelta, active])

  const onPointerUp = useCallback(function onInteractionEnd({ clientX: left, clientY: top }: PointerEvent) {
    if (startPos) {
      const interactionDistance = Math.sqrt(
        ((startPos.left - left) ** 2)
         + ((startPos.top - top) ** 2),
      );
      if (interactionDistance > interactionDebounce) {
        const lastPosition = last(positions);
        if (lastPosition && lastPosition.vertical && lastPosition.horizontal) {
          setMomentumSpeed({
            x: lastPosition.vertical,
            y: lastPosition.horizontal
          })
        }
        startMomentum();
      }
    }
    setActive(false)
  }, [startPos, positions, setMomentumSpeed, startMomentum])

  return {
    delta,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerOut: onPointerUp,
    onPointerLeave: onPointerUp
  };
}