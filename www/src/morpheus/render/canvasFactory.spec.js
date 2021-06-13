import {
  reset,
  instances,
} from 'utils/canvas';
import createFactory from './canvasFactory';

jest.mock('utils/canvas');

describe('canvasFactory', () => {
  afterEach(reset);

  it('gets canvases', () => {
    const canvasFactory = createFactory();
    expect(canvasFactory().instance).toEqual(instances[0]);
  });

  it('has a max', () => {
    const canvasFactory = createFactory({
      maxCanvases: 10,
    });
    const _instances = [];
    for (let i = 0; i < 10; i++) {
      _instances.push(canvasFactory().instance);
    }
    expect(canvasFactory).toThrowErrorMatchingSnapshot();
    expect(_instances).toEqual(expect.arrayContaining(instances));
  });

  it('can release', () => {
    const canvasFactory = createFactory({
      maxCanvases: 2,
    });
    const first = canvasFactory();
    canvasFactory();
    first.release();
    const third = canvasFactory();
    expect(first.instance).toEqual(third.instance);
  });
});
