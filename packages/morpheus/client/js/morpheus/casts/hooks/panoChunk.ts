import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import createCanvas from 'utils/canvas'
import { CanvasTexture } from 'three'
import { DST_WIDTH, DST_HEIGHT, PANO_CANVAS_WIDTH } from 'morpheus/constants'
import type { PanoAnim } from '../types'
import {
  getPanoAnimationFrameSignature,
  getPanoAnimationPlacements,
} from '../panoAnimation'

export interface PanoAnimationMediaLayer {
  cast: PanoAnim
  media: HTMLVideoElement
}

interface PanoChunk {
  texture: CanvasTexture | undefined
  updateAnimationFrames: () => void
}

export default function usePanoChunk(
  img: HTMLImageElement | undefined,
  offsetX: number,
  animationLayers: readonly PanoAnimationMediaLayer[] = []
): PanoChunk {
  const canvas = useMemo(
    () =>
      createCanvas({
        width: 1024,
        height: 512,
      }),
    []
  )
  const texture = useMemo(() => {
    if (canvas) {
      const texture = new CanvasTexture(canvas)
      texture.flipY = false
      return texture
    }
    return undefined
  }, [canvas])
  const sourceCanvas = useMemo(() => {
    if (img) {
      const fullPano = createCanvas({
        width: 3072,
        height: 512,
      })
      const ctx = fullPano.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, 2048, 512, 0, 0, 2048, 512)
        ctx.drawImage(img, 0, 512, 1024, 512, 2048, 0, 1024, 512)
        return fullPano
      }
    }
    return undefined
  }, [img])

  const drawChunk = useCallback(() => {
    if (!sourceCanvas || !texture) {
      return
    }

    const dstContext = canvas.getContext('2d')
    if (!dstContext) {
      return
    }

    dstContext.clearRect(0, 0, DST_WIDTH, DST_HEIGHT)
    if (offsetX > PANO_CANVAS_WIDTH - DST_WIDTH) {
      const firstChunkWidth = PANO_CANVAS_WIDTH - offsetX
      const secondChunkWidth = DST_WIDTH - firstChunkWidth
      dstContext.drawImage(
        sourceCanvas,
        offsetX,
        0,
        firstChunkWidth,
        DST_HEIGHT,
        0,
        0,
        firstChunkWidth,
        DST_HEIGHT
      )
      dstContext.drawImage(
        sourceCanvas,
        0,
        0,
        secondChunkWidth,
        DST_HEIGHT,
        firstChunkWidth,
        0,
        secondChunkWidth,
        DST_HEIGHT
      )
    } else {
      dstContext.drawImage(
        sourceCanvas,
        offsetX,
        0,
        DST_WIDTH,
        DST_HEIGHT,
        0,
        0,
        DST_WIDTH,
        DST_HEIGHT
      )
    }

    for (const { cast, media } of animationLayers) {
      if (media.readyState < 2) {
        continue
      }

      const width = cast.width > 0 ? cast.width : media.videoWidth
      const height = cast.height > 0 ? cast.height : media.videoHeight
      for (const placement of getPanoAnimationPlacements({
        cast,
        offsetX,
        width,
        height,
      })) {
        dstContext.drawImage(
          media,
          0,
          0,
          width,
          height,
          placement.destinationX,
          placement.destinationY,
          placement.width,
          placement.height
        )
      }
    }

    texture.needsUpdate = true
  }, [animationLayers, canvas, offsetX, sourceCanvas, texture])

  const frameSignatureRef = useRef('')
  useLayoutEffect(() => {
    frameSignatureRef.current =
      getPanoAnimationFrameSignature(animationLayers)
    drawChunk()
  }, [animationLayers, drawChunk, img, offsetX])

  const updateAnimationFrames = useCallback(() => {
    const frameSignature = getPanoAnimationFrameSignature(animationLayers)
    if (frameSignature === frameSignatureRef.current) {
      return
    }
    frameSignatureRef.current = frameSignature
    drawChunk()
  }, [animationLayers, drawChunk])

  return { texture, updateAnimationFrames }
}
