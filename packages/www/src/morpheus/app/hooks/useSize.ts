import { useContext, useState } from 'react';
import { useEffect, useMemo } from 'react';
import { from, fromEvent, map, Observable } from 'rxjs';

import createContext from 'utils/createContext';

export interface ResizeRequest {
  height: number;
  width: number;
  x: number;
  y: number;
}

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

function transform(reqWidth: number, reqHeight: number): ResizeRequest {
  let horizontalPadding = 0;
  let verticalPadding = 0;
  let width = reqWidth || window.innerWidth;
  let height = reqHeight || window.innerHeight;
  if (width / height > ORIGINAL_ASPECT_RATIO) {
    // Need to add padding to sides
    const widthOffset = width - height * ORIGINAL_ASPECT_RATIO;
    width -= widthOffset;
    horizontalPadding = widthOffset / 2;
  } else {
    // Need to add padding to top and bottom
    const heightOffset = height - width / ORIGINAL_ASPECT_RATIO;
    height -= heightOffset;
    verticalPadding = heightOffset / 2;
  }
  return {
    height,
    width,
    x: horizontalPadding,
    y: verticalPadding,
  };
}

interface State {
  height: number;
  width: number;
  x: number;
  y: number;
  stream: Observable<ResizeRequest>;
}

function useResize(): State {
  // Take latest from stream to be able to rebroadcast later
  const [lastResize, setLastResize] = useState<ResizeRequest>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  useEffect(() => {
    setLastResize(transform(window.innerWidth, window.innerHeight));
    const subscription = stream.subscribe(setLastResize);
    return () => {
      subscription.unsubscribe();
    };
  }, [setLastResize]);

  const stream = useMemo(() => {
    if (typeof window === 'undefined') {
      return from([]);
    }
    return fromEvent(window, 'resize').pipe(
      map(() => transform(window.innerWidth, window.innerHeight)),
    );
  }, []);

  return useMemo(() => {
    return {
      height: lastResize.height,
      width: lastResize.width,
      x: lastResize.x,
      y: lastResize.y,
      stream,
    };
  }, [lastResize, stream]);
}

const [getContext, Provider] = createContext(() => useResize());

export { Provider };
export default function () {
  return useContext(getContext());
}
