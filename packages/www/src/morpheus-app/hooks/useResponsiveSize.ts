import { useState, useEffect, useRef } from 'react';

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

export interface ResponsiveSize {
  width: number;
  height: number;
  left: number;
  top: number;
}

function calculateSize(
  containerWidth: number,
  containerHeight: number,
): ResponsiveSize {
  let horizontalPadding = 0;
  let verticalPadding = 0;
  let width = containerWidth;
  let height = containerHeight;

  if (width / height > ORIGINAL_ASPECT_RATIO) {
    const widthOffset = width - height * ORIGINAL_ASPECT_RATIO;
    width -= widthOffset;
    horizontalPadding = widthOffset / 2;
  } else {
    const heightOffset = height - width / ORIGINAL_ASPECT_RATIO;
    height -= heightOffset;
    verticalPadding = heightOffset / 2;
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height),
    left: Math.floor(horizontalPadding),
    top: Math.floor(verticalPadding),
  };
}

function getViewportSize(): { width: number; height: number } {
  if (typeof document === 'undefined') {
    return { width: 800, height: 600 };
  }
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
}

export default function useResponsiveSize(): ResponsiveSize {
  const lastSize = useRef<{ width: number; height: number } | null>(null);
  
  const [size, setSize] = useState<ResponsiveSize>(() => {
    const viewport = getViewportSize();
    return calculateSize(viewport.width, viewport.height);
  });

  useEffect(() => {
    const updateSize = () => {
      const viewport = getViewportSize();
      
      if (
        lastSize.current &&
        lastSize.current.width === viewport.width &&
        lastSize.current.height === viewport.height
      ) {
        return;
      }
      
      lastSize.current = viewport;
      setSize(calculateSize(viewport.width, viewport.height));
    };

    updateSize();

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return size;
}
