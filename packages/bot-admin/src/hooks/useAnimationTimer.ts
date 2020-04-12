import { useState, useEffect } from 'react'

export default function useAnimationTimer(
  duration = 1000,
  delay = 0
): [number, boolean] {
  const [elapsed, setTime] = useState(0)
  const [running, setRunning] = useState(true)

  useEffect(
    () => {
      let animationFrame: number, timerStop: number, start: number

      // Function to be executed on each animation frame
      function onFrame() {
        setTime(Date.now() - start)
        loop()
      }

      // Call onFrame() on next animation frame
      function loop() {
        animationFrame = requestAnimationFrame(onFrame)
      }

      function onStart() {
        // Set a timeout to stop things when duration time elapses
        timerStop = setTimeout(() => {
          cancelAnimationFrame(animationFrame)
          setTime(Date.now() - start)
          setRunning(false)
        }, duration)

        // Start the loop
        start = Date.now()
        loop()
      }

      // Start after specified delay (defaults to 0)
      const timerDelay = setTimeout(onStart, delay)

      // Clean things up
      return () => {
        clearTimeout(timerStop)
        clearTimeout(timerDelay)
        cancelAnimationFrame(animationFrame)
      }
    },
    [duration, delay] // Only re-run effect if duration or delay changes
  )

  return [elapsed, running]
}
