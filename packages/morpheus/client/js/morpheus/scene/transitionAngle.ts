import { PANO_SCROLL_OVERFLOW } from 'morpheus/constants'

const FULL_ROTATION = 3600

function normalizeAngle(value: number): number {
  const normalized = value % FULL_ROTATION
  return normalized < 0 ? normalized + FULL_ROTATION : normalized
}

export function transitionAngleToPanoramaYaw(
  angleAtEnd: number
): number | undefined {
  if (!Number.isFinite(angleAtEnd) || angleAtEnd === -1) {
    return undefined
  }

  // Transition movies store the authored centerline at their final frame.
  // The panorama renderer keeps one eighth of its 1024-unit texture chunk
  // outside the visible viewport so it can scroll without redrawing.
  return normalizeAngle(angleAtEnd - PANO_SCROLL_OVERFLOW)
}
