import { Cast, MovieSpecialCast } from 'morpheus/casts/types'

export const ORIGINAL_HEIGHT = 400
export const ORIGINAL_WIDTH = 640
export const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT

export function resizeToScreen({
  width,
  height,
  top,
  left,
  right,
  bottom,
  clip = false,
}: {
  width: number
  height: number
  top: number
  left: number
  right: number
  bottom: number
  clip?: boolean
}) {
  if (width / height > ORIGINAL_ASPECT_RATIO) {
    const adjustedHeight = width / ORIGINAL_ASPECT_RATIO
    const clipHeight = adjustedHeight - height
    const widthScaler = width / ORIGINAL_WIDTH
    const heightScaler = adjustedHeight / ORIGINAL_HEIGHT
    const x = left * widthScaler
    const sizeX = right * widthScaler - x

    let y = top * heightScaler - clipHeight / 2
    let sizeY = (bottom - top) * heightScaler

    if (clip) {
      if (y < 0) {
        sizeY += y
        y = 0
      } else if (y > height) {
        sizeY -= y - height
        y = height
      }
      if (y + sizeY > height) {
        sizeY = height - y
      }
    }

    return {
      x,
      y,
      sizeX,
      sizeY,
    }
  }
  const adjustedWidth = height * ORIGINAL_ASPECT_RATIO
  const clipWidth = adjustedWidth - width
  const widthScaler = adjustedWidth / ORIGINAL_WIDTH
  const heightScaler = height / ORIGINAL_HEIGHT
  const y = top * heightScaler
  const sizeY = bottom * heightScaler - y

  let x = left * widthScaler - clipWidth / 2
  let sizeX = (right - left) * widthScaler

  if (clip) {
    if (x < 0) {
      sizeX += x
      x = 0
    } else if (x > width) {
      sizeX -= y - width
      x = width
    }
    if (x + sizeX > width) {
      sizeX = width - x
    }
  }

  return {
    x,
    y,
    sizeX,
    sizeY,
  }
}

export function generateMovieTransform({
  cast,
  dimensions,
}: {
  cast: MovieSpecialCast
  dimensions: {
    width: number
    height: number
  }
}) {
  const { width, height } = dimensions
  const {
    scale,
    location: { y: top, x: left },
  } = cast
  const bottom = top + cast.height
  const right = left + cast.width
  const { x, y, sizeX, sizeY } = resizeToScreen({
    top,
    left,
    bottom,
    right,
    width,
    height,
  })
  return {
    left: x * (scale || 1),
    top: y * (scale || 1),
    width: sizeX * (scale || 1),
    height: sizeY * (scale || 1),
  }
}
