import React, {
  useRef,
  useEffect,
  useMemo,
  MouseEvent,
  TouchEvent,
} from 'react'
import { useSelector } from 'react-redux'
import raf from 'raf'
// @ts-ignore
import { selectors as gameSelectors } from 'morpheus/game'
// @ts-ignore
import { selectors as inputSelectors } from 'morpheus/input'
import { number } from 'prop-types'

export type Renderable = (ctx: CanvasRenderingContext2D) => void

interface CanvasProps {
  width: number
  height: number
  top: number
  left: number
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
  top,
  left,
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
  const cursor = useSelector(gameSelectors.cursorImg) as CanvasImageSource
  const cursorPos = useSelector(inputSelectors.cursorPosition) as {
    left: number
    top: number
  }
  const cursorRenderable = useMemo(() => {
    return (ctx: CanvasRenderingContext2D) => {
      if (cursor) {
        const screenPos = {
          x: cursorPos.left - (cursor.width as number) / 2,
          y: cursorPos.top - (cursor.height as number) / 2,
        }
        ctx.drawImage(
          cursor,
          0,
          0,
          cursor.width as number,
          cursor.height as number,
          screenPos.x,
          screenPos.y,
          cursor.width as number,
          cursor.height as number,
        )
      }
    }
  }, [cursor, cursorPos])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const allRenderables = useMemo(() => {
    return [...exiting, ...entering, ...onstage, cursorRenderable]
  }, [exiting, entering, onstage, cursorRenderable])
  useEffect(() => {
    let isRunning = true
    function loop() {
      if (isRunning && canvasRef.current) {
        try {
          render(canvasRef.current.getContext('2d'), allRenderables)
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
  }, [canvasRef.current, allRenderables])
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
        cursor: 'none',
        width: `${width}px`,
        height: `${height}px`,
        left: `${left}px`,
        top: `${top}px`,
      }}
    />
  )
}

export default Canvas
