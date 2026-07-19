import {
  DST_HEIGHT,
  DST_RATIO,
  PANO_OFFSET,
  PANO_SCROLL_OVERFLOW,
} from 'morpheus/constants'

const FULL_ROTATION = 3600

function normalizeAngle(value: number): number {
  const normalized = value % FULL_ROTATION
  return normalized < 0 ? normalized + FULL_ROTATION : normalized
}

export function authoredPanoramaAngleToRendererYaw(angle: number): number {
  return normalizeAngle(angle - PANO_SCROLL_OVERFLOW)
}

export function rendererYawToAuthoredPanoramaAngle(yaw: number): number {
  return normalizeAngle(yaw + PANO_SCROLL_OVERFLOW)
}

export function panoramaUvToAuthoredPosition(params: {
  uvX: number
  uvY: number
  rendererYaw: number
}): { top: number; left: number } {
  const { uvX, uvY, rendererYaw } = params
  const centerAngle = rendererYawToAuthoredPanoramaAngle(rendererYaw)
  const rayAngleOffset = (0.5 - uvX) * PANO_OFFSET * DST_RATIO

  return {
    top: (0.5 - uvY) * DST_HEIGHT,
    left: normalizeAngle(centerAngle + rayAngleOffset),
  }
}
