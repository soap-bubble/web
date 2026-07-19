import { get } from 'lodash'
import { isCastActive, Gamestates } from 'morpheus/gamestate/isActive'
import { Matcher } from 'morpheus/casts/matchers'
import { and } from 'utils/matchers'
import { resizeToScreen } from 'utils/resize'
import { Renderable } from 'morpheus/casts/components/Canvas'
import {
  CastSource,
  DrawOperation,
  DrawSource,
  ImageRef,
  Rect,
  VideoRef,
  ControlledImageRef,
} from './types'
import {
  MovieCast,
  ControlledMovieCast,
  MovieSpecialCast,
  Cast,
} from 'morpheus/casts/types'
import { VideoController } from 'morpheus/casts/components/Videos'

function getDrawSourceDimensions(img: DrawSource): { width: number; height: number } {
  if (img instanceof HTMLVideoElement) {
    return { width: img.videoWidth, height: img.videoHeight }
  }
  if (img instanceof HTMLImageElement) {
    return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height }
  }
  // HTMLCanvasElement
  return { width: img.width, height: img.height }
}

interface FrameSourceRect {
  x: number
  y: number
  width: number
  height: number
}

interface FrameLayout {
  frameWidth: number
  frameHeight: number
  cols: number
  rows: number
  frameCount: number
}

const frameLayoutCache = new WeakMap<DrawSource, FrameLayout>()

// Composite states authored by TwoAxisSlider hotspots in morpheus.map.json.
// Their least-significant axis has eight values, so the movie is sampled as
// eight physical Y rows instead of as one linear animation.
const TWO_AXIS_GRID_WIDTH_BY_GAMESTATE = new Map<number, number>([
  [1020, 8],
  [1021, 8],
  [1034, 8],
])

// Known frame dimensions for different asset sources
// New extracted assets use 352x288 (1.222 aspect ratio)
// Original game uses 320x200 scaled dimensions (1.6 aspect ratio)
const KNOWN_FRAME_DIMENSIONS = [
  { width: 352, height: 288 },  // New extracted assets
]

function detectFrameDimensions(
  imgWidth: number,
  imgHeight: number,
  castFrameWidth: number,
  castFrameHeight: number
): { frameWidth: number; frameHeight: number; cols: number; rows: number } {
  // First, check if image dimensions are exact multiples of known frame sizes
  for (const known of KNOWN_FRAME_DIMENSIONS) {
    const cols = imgWidth / known.width
    const rows = imgHeight / known.height
    // Check if these divide evenly (within small tolerance for rounding)
    if (cols >= 1 && rows >= 1 && 
        Math.abs(cols - Math.round(cols)) < 0.01 &&
        Math.abs(rows - Math.round(rows)) < 0.01) {
      return {
        frameWidth: known.width,
        frameHeight: known.height,
        cols: Math.round(cols),
        rows: Math.round(rows),
      }
    }
  }

  // Check for single-row sprite sheet (original format)
  // Image height matches cast height within tolerance
  if (Math.abs(imgHeight - castFrameHeight) <= 2) {
    const cols = Math.max(1, Math.round(imgWidth / castFrameWidth))
    return {
      frameWidth: imgWidth / cols,
      frameHeight: imgHeight,
      cols,
      rows: 1,
    }
  }

  // Fall back to calculating grid from cast dimensions
  const cols = Math.max(1, Math.floor(imgWidth / castFrameWidth))
  const rows = Math.max(1, Math.round(imgHeight / castFrameHeight))
  
  return {
    frameWidth: imgWidth / cols,
    frameHeight: imgHeight / rows,
    cols,
    rows,
  }
}

export function countOccupiedAtlasFrames(
  pixels: Uint8ClampedArray,
  totalFrames: number
): number {
  for (let frame = totalFrames - 1; frame >= 0; frame -= 1) {
    if (pixels[frame * 4 + 3] !== 0) {
      return frame + 1
    }
  }
  return totalFrames
}

function detectAtlasFrameCount({
  img,
  imgWidth,
  imgHeight,
  cols,
  rows,
}: {
  img: DrawSource
  imgWidth: number
  imgHeight: number
  cols: number
  rows: number
}): number {
  const totalFrames = cols * rows
  if (typeof document === 'undefined') {
    return totalFrames
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = cols
    canvas.height = rows
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      return totalFrames
    }

    context.drawImage(
      img,
      0,
      0,
      imgWidth,
      imgHeight,
      0,
      0,
      cols,
      rows
    )
    return countOccupiedAtlasFrames(
      context.getImageData(0, 0, cols, rows).data,
      totalFrames
    )
  } catch (error) {
    console.warn('Unable to inspect controlled-movie atlas padding', error)
    return totalFrames
  }
}

function getFrameLayout(
  img: DrawSource,
  castFrameWidth: number,
  castFrameHeight: number
): FrameLayout {
  const cached = frameLayoutCache.get(img)
  if (cached) {
    return cached
  }

  const { width: imgWidth, height: imgHeight } = getDrawSourceDimensions(img)
  const dimensions = detectFrameDimensions(
    imgWidth,
    imgHeight,
    castFrameWidth,
    castFrameHeight
  )
  const layout = {
    ...dimensions,
    frameCount: detectAtlasFrameCount({
      img,
      imgWidth,
      imgHeight,
      cols: dimensions.cols,
      rows: dimensions.rows,
    }),
  }
  frameLayoutCache.set(img, layout)
  return layout
}

export function calculateControlledFrameIndex({
  value,
  maxValue,
  frames,
  frameCount,
  direction,
  logicalGridWidth,
}: {
  value: number
  maxValue: number
  frames: number
  frameCount: number
  direction: number
  logicalGridWidth?: number
}): number {
  const framesPerValue = Math.max(1, frames)
  const logicalFrame = Math.max(0, Math.round(value)) * framesPerValue
  const logicalMaxFrame = Math.max(0, maxValue) * framesPerValue

  if (direction !== 0 || logicalMaxFrame === 0 || frameCount <= 1) {
    return Math.min(Math.max(0, frameCount - 1), logicalFrame)
  }

  // TwoAxisSlider stores a square logical grid as row-major state. Converted
  // movies contain many horizontal samples per Y row, so preserve the row
  // boundary instead of interpolating through the end of the previous row.
  if (
    logicalGridWidth !== undefined &&
    logicalGridWidth > 1 &&
    framesPerValue === 1 &&
    frameCount > maxValue + 1
  ) {
    const roundedValue = Math.min(maxValue, Math.max(0, Math.round(value)))
    const column = roundedValue % logicalGridWidth
    const row = Math.floor(roundedValue / logicalGridWidth)
    const rowStart = Math.round((row * frameCount) / logicalGridWidth)
    const rowEnd = Math.round(((row + 1) * frameCount) / logicalGridWidth)
    const rowFrameCount = Math.max(1, rowEnd - rowStart)
    const columnProgress =
      logicalGridWidth <= 1 ? 0 : column / (logicalGridWidth - 1)

    return Math.min(
      frameCount - 1,
      rowStart + Math.round(columnProgress * (rowFrameCount - 1))
    )
  }

  const progress = Math.min(1, logicalFrame / logicalMaxFrame)
  return Math.round(progress * (frameCount - 1))
}

function calculateFrameSourceRect(
  frameIndex: number,
  layout: FrameLayout
): FrameSourceRect {
  // Find frame position in grid
  const col = frameIndex % layout.cols
  const row = Math.floor(frameIndex / layout.cols)
  
  return {
    x: col * layout.frameWidth,
    y: row * layout.frameHeight,
    width: layout.frameWidth,
    height: layout.frameHeight,
  }
}

export function calculateControlledFrameOperation({
  cast,
  img,
  gamestates,
  rect,
}: {
  cast: ControlledMovieCast
  img: DrawSource
  gamestates: Gamestates
  rect: Rect
}): Renderable {
  const { controlledMovieCallbacks, width, height } = cast
  const gameStateId = get(controlledMovieCallbacks, '[0].gameState', null)
  const frames = get(controlledMovieCallbacks, '[0].frames', 1)
  const direction = get(controlledMovieCallbacks, '[0].direction', 0)

  const renderable: Renderable = (context: CanvasRenderingContext2D) => {
    // Read gamestate value at render time so it reflects current state
    const gs = gamestates.byId(gameStateId)
    const layout = getFrameLayout(img, width, height)
    const frameIdx = calculateControlledFrameIndex({
      value: gs.value,
      maxValue: gs.maxValue,
      frames,
      frameCount: layout.frameCount,
      direction,
      logicalGridWidth: TWO_AXIS_GRID_WIDTH_BY_GAMESTATE.get(gameStateId),
    })

    // Calculate source rectangle in sprite sheet grid (left-to-right, top-to-bottom)
    // This handles both single-row and grid layouts, including scaled sprite sheets
    const srcRect = calculateFrameSourceRect(frameIdx, layout)

    context.drawImage(
      img,
      srcRect.x,
      srcRect.y,
      srcRect.width,
      srcRect.height,
      rect.x,
      rect.y,
      rect.sizeX,
      rect.sizeY
    )
  }
  renderable.description = () => {
    const gs = gamestates.byId(gameStateId)
    return `cast: ${cast.castId} src: ${cast.fileName} gamestateId: ${gameStateId} value: ${gs.value}`
  }
  return renderable
}

export function matchActiveCast<T extends Cast>(
  gamestates: Gamestates
): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates })
}

export function calculateImageOperation({
  cast,
  img,
  rect,
}: {
  cast: MovieCast
  img: DrawSource
  rect: Rect
}): Renderable {
  const { scale = 1 } = cast

  const renderable: Renderable = (ctx: CanvasRenderingContext2D) => {
    // Use actual image dimensions for source rect to handle assets that don't
    // match their declared cast dimensions
    const imgDimensions = getDrawSourceDimensions(img)
    
    const drawOperation: DrawOperation = [
      img,
      0,
      0,
      imgDimensions.width,
      imgDimensions.height,
      rect.x * scale,
      rect.y * scale,
      rect.sizeX * scale,
      rect.sizeY * scale,
    ]
    ctx.drawImage(...drawOperation)
  }
  renderable.description = () => {
    const imgDimensions = getDrawSourceDimensions(img)
    return `cast: ${cast.castId} src: ${cast.fileName} src.x: 0 src.y 0 src.width ${imgDimensions.width} src.height ${imgDimensions.height} dest.x ${rect.x} dest.y ${rect.y} width: ${rect.sizeX} height ${rect.sizeY}`
  }
  return renderable
}

export function* generateMovieCastRenderables({
  images,
  activeMovieCasts,
  width,
  height,
  gamestates,
}: {
  images: ImageRef[]
  activeMovieCasts: VideoRef[]
  width: number
  height: number
  gamestates: Gamestates
}) {
  const matchActiveImage = matchActiveCast(gamestates)
  const matchActiveImages = and<CastSource<VideoController, MovieCast>>(
    ([_, casts]) => !!casts.length,
    ([_, casts]) => !!casts.find(matchActiveImage)
  )
  for (let image of images) {
    const [img, casts] = image
    for (const cast of casts) {
      const { location } = cast
      yield calculateImageOperation({
        cast,
        img,
        rect: resizeToScreen({
          left: location.x,
          top: location.y,
          right: location.x + cast.width,
          bottom: location.y + cast.height,
          width,
          height,
        }),
      })
    }
  }
  for (let movieRef of activeMovieCasts) {
    const [img, casts] = movieRef
    if (img && casts.length && matchActiveImages(movieRef)) {
      for (const cast of casts) {
        const { location } = cast
        if (img.el) {
          yield calculateImageOperation({
            cast,
            img: img.el,
            rect: resizeToScreen({
              left: location.x,
              top: location.y,
              right: location.x + cast.width,
              bottom: location.y + cast.height,
              width,
              height,
            }),
          })
        }
      }
    }
  }
}

export function* generateMovieCastDrawOps({
  images,
  activeMovieCasts,
  width,
  height,
  gamestates,
}: {
  images: ImageRef[]
  activeMovieCasts: VideoRef[]
  width: number
  height: number
  gamestates: Gamestates
}) {
  const matchActiveImage = matchActiveCast(gamestates)
  const matchActiveImages = and<CastSource<VideoController, MovieCast>>(
    ([_, casts]) => !!casts.length,
    ([_, casts]) => !!casts.find(matchActiveImage)
  )
  for (let image of images) {
    const [img, casts] = image
    for (const cast of casts) {
      const { location } = cast
      yield calculateImageOperation({
        cast,
        img,
        rect: resizeToScreen({
          left: location.x,
          top: location.y,
          right: location.x + cast.width,
          bottom: location.y + cast.height,
          width,
          height,
        }),
      })
    }
  }
  for (let movieRef of activeMovieCasts) {
    const [img, casts] = movieRef
    if (img && casts.length && matchActiveImages(movieRef)) {
      for (const cast of casts) {
        const { location } = cast
        if (img.el) {
          yield calculateImageOperation({
            cast,
            img: img.el,
            rect: resizeToScreen({
              left: location.x,
              top: location.y,
              right: location.x + cast.width,
              bottom: location.y + cast.height,
              width,
              height,
            }),
          })
        }
      }
    }
  }
}

export function generateControlledRenderables({
  controlledCasts,
  width,
  height,
  gamestates,
}: {
  controlledCasts: ControlledImageRef[]
  width: number
  height: number
  gamestates: Gamestates
}): Renderable[] {
  return controlledCasts.reduce((memo, [img, casts]) => {
    for (const cast of casts) {
      let location = cast.location
      if (cast.controlledLocation) {
        location = cast.controlledLocation
      }
      memo.push(
        calculateControlledFrameOperation({
          cast,
          img,
          gamestates,
          rect: resizeToScreen({
            left: location.x,
            top: location.y,
            right: location.x + cast.width,
            bottom: location.y + cast.height,
            width,
            height,
          }),
        })
      )
    }
    return memo
  }, [] as Renderable[])
}

export function* generateRenderables(
  renderables: Renderable[]
): Generator<Renderable, void, unknown> {
  for (let renderable of renderables) {
    const r: Renderable = (ctx: CanvasRenderingContext2D) => renderable(ctx)
    if (renderable.description) {
      r.description = renderable.description
    }
    yield r
  }
}

export function computerRenderables(
  images: CastSource<DrawSource, MovieSpecialCast>[],
  activeMovieCasts: CastSource<VideoController, MovieSpecialCast>[],
  controlledCasts: CastSource<DrawSource, ControlledMovieCast>[],
  gamestates: Gamestates,
  width: number,
  height: number
) {
  return [
    ...generateRenderables([
      ...generateMovieCastRenderables({
        images,
        activeMovieCasts,
        width,
        height,
        gamestates,
      }),
      ...generateControlledRenderables({
        controlledCasts,
        width,
        height,
        gamestates,
      }),
    ]),
  ]
}
