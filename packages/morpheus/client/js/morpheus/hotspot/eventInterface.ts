import { useMemo } from 'react'
import { PointerEvent as RTFPointerEvent } from 'react-three-fiber'

type SupportRTFPointerEvent = PointerEvent|RTFPointerEvent
type PointerEventKeys = "onPointerUp" | "onPointerMove" | "onPointerDown" | "onPointerOut" | "onPointerCancel" | "onPointerLeave"
interface PointerEvents {
  onPointerUp?(event: SupportRTFPointerEvent): void
  onPointerMove?(event: SupportRTFPointerEvent): void
  onPointerDown?(event: SupportRTFPointerEvent): void
  onPointerOut?(event: SupportRTFPointerEvent): void
  onPointerCancel?(event: SupportRTFPointerEvent): void
  onPointerLeave?(event: SupportRTFPointerEvent): void
}

export const pointerInterface: PointerEventKeys[] = [
  'onPointerUp',
  'onPointerMove',
  'onPointerDown',
  'onPointerOut',
  'onPointerCancel',
  'onPointerLeave'
];

export function usePointerEvents(...delegates: PointerEvents[]) {
  return useMemo(() => composePointer(delegates), pointerInterface.reduce((memo, curr) => {
    for (const delegate of delegates) {
      memo.push(delegate[curr])
    }
    return memo
  }, [] as (((event: SupportRTFPointerEvent) => void)|undefined)[]))
}

export function composePointer(delegate: PointerEvents[]) { 
  return pointerInterface.reduce((tmi, method) => {
    tmi[method] = function composePointerDelegate(event: any) {
      delegate.forEach(d =>  {
        const handler = d[method]
        if (handler) {
          handler(event) 
        }
      });
    };
    return tmi;
  }, {} as PointerEvents)
};

type MouseTouchEventKeys = "onMouseUp" | "onMouseMove" | "onMouseDown" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel"
interface MouseTouchEvents {
  onMouseUp?(event: MouseEvent): any
  onMouseMove?(event: MouseEvent): any
  onMouseDown?(event: MouseEvent): any
  onTouchStart?(event: TouchEvent): any
  onTouchMove?(event: TouchEvent): any
  onTouchEnd?(event: TouchEvent): any
  onTouchCancel?(event: TouchEvent): any
}

export const touchMouseInterface: MouseTouchEventKeys[] = [
  'onMouseUp',
  'onMouseMove',
  'onMouseDown',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
];

export const composeMouseTouch = (...delegate: MouseTouchEvents[]) => touchMouseInterface.reduce((tmi, method) => {
  tmi[method] = function composeMouseTouchDelegate(event: any) {
    delegate.forEach(d =>  {
      const handler = d[method]
      if (handler) {
        handler(event) 
      }
    });
  };
  return tmi;
}, {} as MouseTouchEvents);

export const touchDisablesMouse = (delegate: MouseTouchEvents) => {
  let isTouch = false;
  return {
    onMouseUp(event: MouseEvent) {
      if (!isTouch && delegate.onMouseUp) {
        delegate.onMouseUp(event);
      }
    },
    onMouseMove(event: MouseEvent) {
      if (!isTouch && delegate.onMouseMove) {
        delegate.onMouseMove(event);
      }
    },
    onMouseDown(event: MouseEvent) {
      if (!isTouch && delegate.onMouseDown) {
        delegate.onMouseDown(event);
      }
    },
    onTouchStart(event: TouchEvent) {
      isTouch = true;
      if (delegate.onTouchStart) {
        delegate.onTouchStart(event);
      }
    },
    onTouchMove(event: TouchEvent) {
      isTouch = true;
      if (delegate.onTouchMove) {
        delegate.onTouchMove(event);
      } 
    },
    onTouchEnd(event: TouchEvent) {
      isTouch = true;
      if ( delegate.onTouchEnd) {
        delegate.onTouchEnd(event);
      }
    },
    onTouchCancel(event: TouchEvent) {
      if (delegate.onTouchCancel) {
        delegate.onTouchCancel(event);
      }
    },
  };
};
