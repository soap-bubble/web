import React, { FC, MutableRefObject, useCallback, useRef } from 'react';
import cn from 'classnames';
import styles from './Title.module.css'
import useSize, { ResizeRequest } from 'morpheus/app/hooks/useSize';
import { Observable } from 'rxjs';
import useScene from 'morpheus/app/hooks/useScene';

interface IProps {
  opacity: number;
  canvasCreated: (el: HTMLCanvasElement, width: number, height: number, stream: Observable<ResizeRequest>) => void;
}

const Title: FC<IProps> = ({
  opacity,
  canvasCreated,
}) => {
  const { width, height, stream } = useSize()
  
  const canvasRef: MutableRefObject<HTMLCanvasElement | undefined> = useRef<HTMLCanvasElement>();
  const onCanvasCreated = useCallback((el: HTMLCanvasElement) => {
    if (!canvasRef.current) {
      canvasRef.current = el
      canvasCreated(el, width, height, stream);
    }
  }, [canvasRef.current, width, height, canvasCreated]);

  return (
    <canvas
      style={{
        opacity,
      }}
      className={cn(styles.title)}
      width={width}
      height={height}
      ref={onCanvasCreated}
    />
  );
}

export default Title