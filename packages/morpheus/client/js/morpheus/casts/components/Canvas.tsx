import React, { useRef, useEffect, MouseEvent, TouchEvent } from 'react'
import raf from 'raf'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

export type Renderable = (ctx: CanvasRenderingContext2D) => void

interface CanvasProps {
  width: number
  height: number
  style: object
  enteringRenderables: Renderable[]
  stageRenderables: Renderable[]
  exitingRenderables: Renderable[]
  onMouseDown: (e: MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (e: MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: (e: MouseEvent<HTMLCanvasElement>) => void
  onTouchMove: (e: TouchEvent<HTMLCanvasElement>) => void
  onTouchStart: (e: TouchEvent<HTMLCanvasElement>) => void
  onTouchEnd: (e: TouchEvent<HTMLCanvasElement>) => void
  onTouchCancel: (e: TouchEvent<HTMLCanvasElement>) => void
}

export function render(
  ctx: CanvasRenderingContext2D | null,
  renderable: Renderable[],
) {
  if (ctx) {
    for (let render of renderable) {
      render(ctx)
    }
  }
}

const Canvas = ({
  height,
  width,
  style,
  enteringRenderables: entering,
  stageRenderables: onstage,
  exitingRenderables: exiting,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchMove,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let isRunning = true
    function loop() {
      if (isRunning && canvasRef.current) {
        try {
          render(canvasRef.current.getContext('2d'), [
            ...exiting,
            ...entering,
            ...onstage,
          ])
        } catch (e) {
          console.error('While running render loop', e)
        }
      }
      if (isRunning) {
        raf(loop)
      }
    }
    raf(loop)
    return () => {
      isRunning = false
    }
  }, [canvasRef.current, onstage])
  return (
    <canvas
      width={width}
      height={height}
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      style={{
        ...style,
        cursor: 'none',
      }}
    />
  )
}

export default Canvas
