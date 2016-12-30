import {
  each,
} from 'lodash';
import {
  addMouseUp,
  addMouseMove,
  addMouseDown,
} from '../actions/ui';
import {
  setHoverIndex,
} from '../actions/hotspots';
import store from '../store';
import renderEvents from '../utils/render';

export default function ({
  dispatch,
  canvas,
}) {
  const pixel = new Uint8Array(4);
  let coordsToCheck;

  renderEvents.on('after', () => {
    if (coordsToCheck) {
      const { left, top } = coordsToCheck;
      const { hotspots } = store.getState();
      const { hitColorList } = hotspots;
      const gl = canvas.getContext('webgl');

      // readPixels reads from lower left so need to inverse top (y) coordinate
      gl.readPixels(left, canvas.height - top, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      let hotspotIndex = null;
      each(hitColorList, (color, index) => {
        const red = color >>> 16;
        const green = color >>> 8 & 0xFF;
        const blue = color & 0xFF;
        if (
          red === pixel[0]
          && green === pixel[1]
          && blue === pixel[2]
        ) {
          hotspotIndex = index;
          return false;
        }
      });
      dispatch(setHoverIndex(hotspotIndex));

      coordsToCheck = null;
    }
  });

  function onMouseUp(mouseEvent) {

  }

  function onMouseMove(mouseEvent) {
    // Grab these right away because of react event object pooling
    //  See https://fb.me/react-event-pooling
    const { clientX: left, clientY: top } = mouseEvent;
    coordsToCheck = { left, top };
  }

  function onMouseDown(mouseEvent) {

  }

  dispatch(addMouseUp(onMouseUp));
  dispatch(addMouseMove(onMouseMove));
  dispatch(addMouseDown(onMouseDown));
}
