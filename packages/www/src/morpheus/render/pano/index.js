import memoize from 'utils/memoize';
import {
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import createFactory from '../canvasFactory';
import loader from './loader';
import selectorsForScene from './selectors';

export const delegate = memoize((scene) => {
  const canvasFactory = createFactory();
  let assets;
  const canvas = canvasFactory().instance;
  const selectors = selectorsForScene(scene);
  const selfie = {
    applies(state) {
      return selectors.panoCastData(state);
    },
    doEnter() {
      return (dispatch, getState) => {
        assets = assets || loader({
          scene,
          gamestates: gamestateSelectors.forState(getState()),
        });
        // canvas.width = 3072;
        // canvas.height = 512;
        // canvas.style.position = 'absolute';
        // canvas.style.top = '0px';
        // canvas.style.left = '0px';
        // document.body.appendChild(canvas);
        return Promise.all(assets.map(a => a.promise))
          .then(() => {});
      };
    },
    update() {
      return () => {
        assets.forEach((contextProvider) => {
          const ctx = canvas.getContext('2d');
          const {
            render,
          } = contextProvider;
          render(ctx);
        });
      };
    },
  };
  return selfie;
});
