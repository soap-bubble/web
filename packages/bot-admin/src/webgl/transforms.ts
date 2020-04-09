import { PerspectiveCamera } from 'three'

export const visibleHeightAtZDepth = (depth: number, camera: PerspectiveCamera) => {
  const cameraOffset = camera.position.z
  if (depth < cameraOffset) depth -= cameraOffset
  else depth += cameraOffset

  const vFOV = (camera.fov * Math.PI) / 180

  return 2 * Math.tan(vFOV / 2) * Math.abs(depth)
}

export const visibleWidthAtZDepth = (depth: number, camera: PerspectiveCamera) => {
  const height = visibleHeightAtZDepth(depth, camera)
  return height * camera.aspect
}

export function sphericalToCartisian(radius: number, phi: number, theta: number): [number, number, number] {
  return [radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)]
}
