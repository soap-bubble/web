import { useMemo, useState, useEffect } from 'react'
import createCanvas from 'utils/canvas'
import {
  CanvasTexture
} from 'three'
import {
  DST_WIDTH,
  DST_HEIGHT,
  PANO_CANVAS_WIDTH,
} from 'morpheus/constants'

export default function usePanoChunk(img: HTMLImageElement|undefined, rotX: number): [CanvasTexture|undefined, number] {
  const canvas = useMemo(() => createCanvas({
    width: 1024,
    height: 512,
  }), [])
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
  const chunk = Math.floor((rotX % 3072) / 24)
  const x = chunk * 24
  useEffect(() => {
    if (sourceCanvas && texture) {
      const dstContext = canvas.getContext('2d')
      const srcContext = sourceCanvas.getContext('2d')
      if (dstContext && srcContext) {
        if (x > PANO_CANVAS_WIDTH - DST_WIDTH) {
          const firstChunkWidth = PANO_CANVAS_WIDTH - x
          const firstChunkWidthMorpheus = DST_WIDTH - firstChunkWidth
          const secondChunkOffset = DST_WIDTH - firstChunkWidthMorpheus
          dstContext.drawImage(
            sourceCanvas,
            x,
            0,
            DST_WIDTH,
            DST_HEIGHT,
            0,
            0,
            DST_WIDTH,
            DST_HEIGHT,
          )
          dstContext.drawImage(
            sourceCanvas,
            0,
            0,
            firstChunkWidthMorpheus,
            DST_HEIGHT,
            secondChunkOffset,
            0,
            firstChunkWidthMorpheus,
            DST_HEIGHT,
          )
        } else {
          dstContext.drawImage(
            sourceCanvas,
            x,
            0,
            DST_WIDTH,
            DST_HEIGHT,
            0,
            0,
            DST_WIDTH,
            DST_HEIGHT,
          )
        }
        texture.needsUpdate = true
      }
    }
  }, [canvas, img, x])
  return [texture, x]
}