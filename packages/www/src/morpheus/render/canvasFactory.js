import {
  isNumber,
} from 'lodash';
import createCanvas from 'utils/canvas';

export default function CanvasFactory(
  {
    maxCanvases,
  } = {}
) {
  const instances = [];

  const factory = function canvasFactory() {
    const freeCanvas = instances.find(i => i.free);

    if (isNumber(maxCanvases)
      && instances.length >= maxCanvases
      && !freeCanvas
    ) {
      throw new Error('no more canvases available');
    }

    if (freeCanvas) {
      freeCanvas.free = false;
      return freeCanvas;
    }
    const canvas = {
      instance: createCanvas(),
      free: false,
    };
    instances.push(canvas);
    return {
      get instance() {
        return canvas.instance;
      },
      release() {
        canvas.free = true;
      },
    };
  };

  return factory;
}
