import {
  DST_HEIGHT,
  DST_WIDTH,
  PANO_CANVAS_WIDTH,
} from 'morpheus/constants'
import { Gamestates, isCastActive } from 'morpheus/gamestate/isActive'
import type { PanoAnim, SceneCasts } from './types'

const PANO_FRAME_WIDTH = 128

export interface PanoAnimationPlacement {
  destinationX: number
  destinationY: number
  width: number
  height: number
}

interface PanoAnimationPlacementOptions {
  cast: PanoAnim
  offsetX: number
  width?: number
  height?: number
}

interface PanoAnimationFrameMedia {
  currentTime: number
  readyState: number
  videoHeight: number
  videoWidth: number
}

interface PanoAnimationFrameLayer {
  cast: PanoAnim
  media: PanoAnimationFrameMedia
}

function isPanoAnimation(cast: SceneCasts): cast is PanoAnim {
  return cast.__t === 'PanoAnim'
}

export function getActivePanoAnimations(
  casts: readonly SceneCasts[],
  gamestates: Gamestates
): PanoAnim[] {
  const seenCastIds = new Set<number>()
  return casts.filter((cast): cast is PanoAnim => {
    if (
      !isPanoAnimation(cast) ||
      seenCastIds.has(cast.castId) ||
      !isCastActive({ cast, gamestates })
    ) {
      return false
    }
    seenCastIds.add(cast.castId)
    return true
  })
}

export function getPanoAnimationPlacements({
  cast,
  offsetX,
  width = cast.width,
  height = cast.height,
}: PanoAnimationPlacementOptions): PanoAnimationPlacement[] {
  if (!(width > 0) || !(height > 0)) {
    return []
  }

  const sourceX = cast.frame * PANO_FRAME_WIDTH + cast.location.x
  const destinationY = cast.location.y
  if (destinationY >= DST_HEIGHT || destinationY + height <= 0) {
    return []
  }

  const placements: PanoAnimationPlacement[] = []
  for (const wrapOffset of [
    -PANO_CANVAS_WIDTH,
    0,
    PANO_CANVAS_WIDTH,
  ]) {
    const destinationX = sourceX - offsetX + wrapOffset
    if (destinationX >= DST_WIDTH || destinationX + width <= 0) {
      continue
    }
    placements.push({
      destinationX,
      destinationY,
      width,
      height,
    })
  }

  return placements
}

export function getPanoAnimationFrameSignature(
  layers: readonly PanoAnimationFrameLayer[]
): string {
  return layers
    .map(
      ({ cast, media }) =>
        `${cast.castId}:${media.readyState}:${media.currentTime}:${media.videoWidth}x${media.videoHeight}`
    )
    .join('|')
}
