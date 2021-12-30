import {
  ORIGINAL_ASPECT_RATIO,
  ORIGINAL_HEIGHT,
  ORIGINAL_WIDTH,
} from 'morpheus/constants'

export function gameToScreen({
  top,
  left,
  height,
  width,
}: {
  top: number
  left: number
  height: number
  width: number
}) {
  return {
    top: top * (height / ORIGINAL_HEIGHT),
    left: left * (width / ORIGINAL_WIDTH),
  }
}

export function screenToGame({
  top,
  left,
  height,
  width,
}: {
  top: number
  left: number
  height: number
  width: number
}) {
  return {
    top: top / (height / ORIGINAL_HEIGHT),
    left: left / (width / ORIGINAL_WIDTH),
  }
}
