import createCanvas, {
  reset as resetMockCanvas,
  instances as mockCanvasInstances,
} from 'utils/canvas';
import {
  loadAsImage,
  loadAsVideo,
} from './contextProviders';
import gearUrl from '../../../image/icon/gear.png';

jest.mock('utils/canvas');
jest.mock('service/image');
jest.mock('utils/video');

describe('contextProvider', () => {
  afterEach(resetMockCanvas);
  describe('loadAsImage', () => {
    it('uses a canvasFactory', () => {
      const canvas = createCanvas();
      const canvasFactory = jest.fn().mockReturnValue(canvas);
      const provider = loadAsImage({
        canvasFactory,
      });
      expect(provider.context).toEqual(canvas);
      expect(canvasFactory).toHaveBeenCalled();
    });

    it('uses a canvasInit', async () => {
      const canvasInit = jest.fn();
      const provider = loadAsImage({
        canvasInit,
      });
      await provider.promise;
      expect(canvasInit).toHaveBeenCalledWith(expect.objectContaining({
        canvas: mockCanvasInstances[0],
      }));
    });

    it('can render with a renderer', async () => {
      const renderer = jest.fn();
      const provider = loadAsImage({
        renderer,
      });
      const canvas = createCanvas();
      provider.render(canvas);
      expect(renderer).toHaveBeenCalledWith(expect.objectContaining({
        dstContext: canvas,
        srcContext: mockCanvasInstances[1],
      }));
    });

    it('copies other fields', () => {
      const provider = loadAsImage({
        foo: 'bar',
      });
      expect(provider.foo).toEqual('bar');
    });
  });

  describe('loadAsVideo', () => {
    it('uses a canvasFactory', () => {
      const canvas = createCanvas();
      const canvasFactory = jest.fn().mockReturnValue(canvas);
      const provider = loadAsVideo({
        canvasFactory,
      });
      expect(provider.context).toEqual(canvas);
      expect(canvasFactory).toHaveBeenCalled();
    });

    it('uses a canvasInit', async () => {
      const canvasInit = jest.fn();
      const provider = loadAsVideo({
        canvasInit,
      });
      await provider.promise;
      expect(canvasInit).toHaveBeenCalledWith(expect.objectContaining({
        canvas: mockCanvasInstances[1],
      }));
    });

    it('can render with a renderer', async () => {
      const renderer = jest.fn();
      const provider = loadAsVideo({
        renderer,
      });
      const canvas = createCanvas();
      provider.render(canvas);
      expect(renderer).toHaveBeenCalledWith(expect.objectContaining({
        dstContext: canvas,
        srcContext: expect.any(Object),
      }));
    });

    it('copies other fields', () => {
      const provider = loadAsVideo({
        foo: 'bar',
      });
      expect(provider.foo).toEqual('bar');
    });
  });
});
