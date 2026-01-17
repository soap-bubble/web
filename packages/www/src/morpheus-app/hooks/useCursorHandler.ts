import { PointerEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Raycaster, Object3D, Camera, Vector2 } from 'three';
import { resolveCursor } from '@soapbubble/morpheus-client/morpheus/input/handlers';
import { isActive, Gamestates } from '@soapbubble/morpheus-client';
import { isHotspot } from 'morpheus/casts/matchers';
import type { Scene, Cast, Hotspot } from 'morpheus/casts/types';
import { and } from '@/utils/matchers';

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const DST_RATIO = 3600 / 3072;
const DST_WIDTH = 1024;

interface CursorState {
  top: number;
  left: number;
  image: HTMLImageElement | undefined;
}

interface PointerHandlers {
  onPointerUp: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerLeave: (e: PointerEvent<HTMLCanvasElement>) => void;
}

interface ClientInputState {
  clientX: number;
  clientY: number;
  wasPointerUpped: boolean;
  wasPointerDown: boolean;
  wasPointerMoved: boolean;
}

type UseCursorHandlerReturn = [CursorState, PointerHandlers];

const cursorCache = new Map<number, Promise<HTMLImageElement | null>>();

function loadCursorImage(cursorId: number): Promise<HTMLImageElement | null> {
  if (cursorId === 0) {
    return Promise.resolve(null);
  }

  const cached = cursorCache.get(cursorId);
  if (cached) {
    return cached;
  }

  const cursorFiles: Record<number, string> = {
    10001: 'Bigarrow.png',
    10011: 'Card.png',
    10008: 'Open.png',
    10009: 'Closed.png',
    10000: 'Wheel.png',
    10002: 'Hand.png',
    10003: 'Tele.png',
    10005: 'Goback.png',
    10007: 'Down.png',
    10010: 'Tapest.png',
    10004: 'Micro.png',
    10012: 'Cur10012.png',
    10013: 'Cur10013.png',
    10014: 'Cur10014.png',
    10015: 'Cur10015.png',
    10016: 'Cur10016.png',
    10017: 'cur10017.png',
    10018: 'cur10018.png',
    10019: 'cur10019.png',
    10020: 'cur10020.png',
    10021: 'cur10021.png',
    10022: 'cur10022.png',
    10023: 'cur10023.png',
    10024: 'cur10024.png',
  };

  const fileName = cursorFiles[cursorId];
  if (!fileName) {
    return Promise.resolve(null);
  }

  const url = `/image/cursors/${fileName}`;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

  cursorCache.set(cursorId, promise);
  return promise;
}

function screenToGame(params: {
  top: number;
  left: number;
  height: number;
  width: number;
}): { top: number; left: number } {
  const { top, left, height, width } = params;
  return {
    top: top / (height / ORIGINAL_HEIGHT),
    left: left / (width / ORIGINAL_WIDTH),
  };
}

export default function useCursorHandler(
  scene: Scene | undefined,
  gamestates: Gamestates | undefined,
  isPanoScene: boolean,
  camera: Camera | undefined,
  panoObject: Object3D | undefined,
  offsetX: number,
  screenLeft: number,
  screenTop: number,
  screenWidth: number,
  screenHeight: number,
): UseCursorHandlerReturn {
  const [cursor, setCursor] = useState<HTMLImageElement | undefined>();
  const [mouseDown, setMouseDown] = useState(false);
  const [lastMouseDown, setLastMouseDown] = useState(0);
  const [clickStartPos, setClickStartPos] = useState({ top: 0, left: 0 });

  const [lastUpdate, setLastUpdatePosition] = useState<ClientInputState>({
    clientY: screenTop,
    clientX: screenLeft,
    wasPointerDown: false,
    wasPointerMoved: false,
    wasPointerUpped: false,
  });

  const { top: cursorTop, left: cursorLeft } = useMemo(
    () => ({
      top: lastUpdate.clientY - screenTop,
      left: lastUpdate.clientX - screenLeft,
    }),
    [lastUpdate, screenTop, screenLeft],
  );

  useEffect(() => {
    setMouseDown(false);
    setClickStartPos({ top: 0, left: 0 });
    setLastUpdatePosition({
      clientX: 0,
      clientY: 0,
      wasPointerDown: false,
      wasPointerMoved: false,
      wasPointerUpped: false,
    });
  }, [scene]);

  const raycaster = useMemo(() => new Raycaster(), []);

  const { top: gameTop, left: gameLeft } = useMemo(() => {
    if (isPanoScene && camera && panoObject && !document.hidden) {
      const y = ((screenHeight - cursorTop) / screenHeight) * 2 - 1;
      const x = ((cursorLeft - screenWidth) / screenWidth) * 2 + 1;

      raycaster.setFromCamera(new Vector2(x, y), camera);
      const panoIntersects = raycaster.intersectObject(panoObject);
      const panoIntersect = panoIntersects.find(
        (intersect) => intersect.uv !== undefined,
      );

      if (panoIntersect?.uv) {
        const { uv } = panoIntersect;
        const top = uv.y * -512 + 256;
        let left =
          (((8 / 7) * (1.0 - uv.x) - 0.5) * DST_WIDTH + offsetX) * DST_RATIO;
        if (left < 0) {
          left += 3600;
        } else if (left > 3600) {
          left -= 3600;
        }
        return { top, left };
      }
    }

    return screenToGame({
      top: cursorTop,
      left: cursorLeft,
      height: screenHeight,
      width: screenWidth,
    });
  }, [
    isPanoScene,
    camera,
    panoObject,
    offsetX,
    raycaster,
    cursorTop,
    cursorLeft,
    screenWidth,
    screenHeight,
  ]);

  const hotspots = useMemo(() => {
    if (!scene || !gamestates) {
      return [];
    }
    const filter = and<Cast>(isHotspot, (cast) =>
      isActive({ cast, gamestates }),
    );
    return scene.casts.filter(filter) as Hotspot[];
  }, [scene, gamestates]);

  const cursorIndex = useMemo(() => {
    if (!gamestates) {
      return 10000;
    }
    return resolveCursor(
      hotspots,
      gamestates,
      { top: gameTop, left: gameLeft },
      clickStartPos,
      mouseDown,
    );
  }, [hotspots, gamestates, gameTop, gameLeft, clickStartPos, mouseDown]);

  useEffect(() => {
    if (cursorIndex !== 0) {
      loadCursorImage(cursorIndex).then((cursorImg) => {
        if (cursorImg) {
          setCursor(cursorImg);
        }
      });
    }
  }, [cursorIndex]);

  useEffect(() => {
    let nextMouseDown = mouseDown;

    if (lastUpdate.wasPointerUpped) {
      nextMouseDown = false;
    }

    if (!nextMouseDown && lastUpdate.wasPointerDown) {
      nextMouseDown = true;
      setClickStartPos({ top: gameTop, left: gameLeft });
      setLastMouseDown(Date.now());
    }

    if (nextMouseDown !== mouseDown) {
      setMouseDown(nextMouseDown);
    }
  }, [gameLeft, gameTop, lastUpdate, mouseDown]);

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const { clientX, clientY } = event;
      setLastUpdatePosition({
        clientX,
        clientY,
        wasPointerDown: false,
        wasPointerMoved: false,
        wasPointerUpped: true,
      });
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const { clientX, clientY } = event;
      setLastUpdatePosition({
        clientX,
        clientY,
        wasPointerDown: false,
        wasPointerMoved: true,
        wasPointerUpped: false,
      });
    },
    [],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const { clientX, clientY } = event;
      setLastUpdatePosition({
        clientX,
        clientY,
        wasPointerDown: true,
        wasPointerMoved: false,
        wasPointerUpped: false,
      });
    },
    [],
  );

  const onPointerLeave = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const { clientX, clientY } = event;
      setLastUpdatePosition({
        clientX,
        clientY,
        wasPointerDown: false,
        wasPointerMoved: false,
        wasPointerUpped: true,
      });
    },
    [],
  );

  return [
    {
      image: cursor,
      top: cursorTop,
      left: cursorLeft,
    },
    {
      onPointerUp,
      onPointerMove,
      onPointerDown,
      onPointerLeave,
    },
  ];
}
