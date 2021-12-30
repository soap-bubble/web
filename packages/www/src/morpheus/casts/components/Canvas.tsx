import React, { useRef, PointerEvent } from "react";
import { useSelector } from "react-redux";
import useRaf from "@rooks/use-raf";
import { selectors as gameSelectors } from "morpheus/game";
import { selectors as inputSelectors } from "morpheus/input";

export interface Renderable {
  (ctx: CanvasRenderingContext2D): void;
  description?(): string;
}

interface CanvasProps {
  width: number;
  height: number;
  top: number;
  left: number;
  renderables: Renderable[];
  onPointerDown?: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerLeave?: (e: PointerEvent<HTMLCanvasElement>) => void;
}

export function render(
  ctx: CanvasRenderingContext2D | null,
  renderable: Renderable[]
) {}

const Canvas = ({
  height,
  width,
  top,
  left,
  renderables,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useRaf(() => {
    if (canvasRef.current) {
      try {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          for (let render of renderables) {
            render(ctx);
          }
        }
      } catch (e) {
        console.error("While running render loop", e);
      }
    }
  }, !!(canvasRef.current && renderables.length));
  return (
    <canvas
      width={width}
      height={height}
      ref={canvasRef}
      onPointerUp={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        cursor: "none",
        position: "absolute",
        width: `${width}px`,
        height: `${height}px`,
        left: `${left}px`,
        top: `${top}px`,
      }}
    />
  );
};

export default Canvas;
