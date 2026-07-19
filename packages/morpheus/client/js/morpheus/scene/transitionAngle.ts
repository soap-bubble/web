import { authoredPanoramaAngleToRendererYaw } from 'morpheus/scene/panoramaCoordinates'

export function transitionAngleToPanoramaYaw(
  angleAtEnd: number
): number | undefined {
  if (!Number.isFinite(angleAtEnd) || angleAtEnd === -1) {
    return undefined
  }

  // Transition movies store the authored centerline at their final frame.
  return authoredPanoramaAngleToRendererYaw(angleAtEnd)
}
