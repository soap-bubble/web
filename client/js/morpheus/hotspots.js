import {
  addMouseUp,
  addMouseMove,
  addMouseDown,
} from '../actions/ui';
import {
  setHoverIndex,
} from '../actions/hotspots';
import store from '../store';

export default function ({
  dispatch,
  canvas,
}) {
  const pixel = new Uint8Array(4);

  function onMouseUp(mouseEvent) {

  }

  function onMouseMove(mouseEvent) {
    const { hotspots } = store.getState();
    const { hitColorList } = hotspots;

    const { clientX: left, clientY: top } = mouseEvent;
    const gl = canvas.getContext('webgl');
    gl.readPixels(left, top, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    let hotspotIndex = null;
    hitColorList.forEach((color, index) => {
      const red = color >>> 16;
      const green = color >>> 8 & 0xFF;
      const blue = color & 0xFF;
      if (
        red === pixel[0]
        && green === pixel[1]
        && blue === pixel[2]
      ) {
        hotspotIndex = index;
      }
    });

    dispatch(setHoverIndex(hotspotIndex));
  }

  function onMouseDown(mouseEvent) {

  }

  dispatch(addMouseUp(onMouseUp));
  dispatch(addMouseMove(onMouseMove));
  dispatch(addMouseDown(onMouseDown));
}
