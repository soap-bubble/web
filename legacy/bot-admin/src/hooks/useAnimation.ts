import useAnimationTimer from './useAnimationTimer'

export default function useAnimation(
  easing: (n: number) => number,
  duration = 500,
  delay = 0
): [number, boolean] {
  // The useAnimationTimer hook calls useState every animation frame ...
  // ... giving us elapsed time and causing a rerender as frequently ...
  // ... as possible for a smooth animation.
  const [elapsed, running] = useAnimationTimer(duration, delay)
  // Amount of specified duration elapsed on a scale from 0 - 1
  const n = Math.min(1, elapsed / duration)
  // Return altered value based on our specified easing function
  return [easing(n), running]
}
