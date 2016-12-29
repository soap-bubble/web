import {
  addMouseUp,
  addMouseMove,
  addMouseDown,
} from '../actions/ui';

export default function ({
  dispatch,
  canvas,
}) {
  const pixel = new Uint8Array(4);

  function onMouseUp(mouseEvent) {

  }

  function onMouseMove(mouseEvent) {
    const { clientX: left, clientY: top } = mouseEvent;
    const gl = canvas.getContext('webgl');
    gl.readPixels(left, top, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    console.log(left, top, pixel);
  }

  function onMouseDown(mouseEvent) {

  }

  dispatch(addMouseUp(onMouseUp));
  dispatch(addMouseMove(onMouseMove));
  dispatch(addMouseDown(onMouseDown));
}
