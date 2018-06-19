import createFactory from '../canvasFactory';
import loader from './loader';
import pano from './renderer';
import selectorsForScene from './selectors';

export default function () {
  const canvasFactory = createFactory();

  return (scene) => {
    let assets;
    const canvas = canvasFactory();
    const selectors = selectorsForScene(scene);
    const selfie = {
      doEnter() {
        return (dispatch, getState) => {
          assets = assets || loader({
            getState,
            selectors,
          });
          return Promise.all(assets.map(a => a.promise))
            .then(() => {});
        };
      },
      update() {
        assets.forEach((contextProvider) => {
          pano({
            canvas,
            contextProvider,
          });
        });
      },
    };
    return selfie;
  };
}
