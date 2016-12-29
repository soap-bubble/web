import { connect } from 'react-redux';

import Canvas from '../presentations/Canvas';
import {
  canvasCreated,
  sceneCreate,
} from '../../actions/hotspots';

function mapStateToProps({ dimensions }) {
  const { width, height } = dimensions;
  return {
    id: 'hotspots-hit',
    width,
    height,
  };
}

function mapDisptachToProps(dispatch) {
  let canvas;
  const pixel = new Uint8Array(4);

  return {
    createAction(_canvas) {
      canvas = _canvas;
      dispatch(canvasCreated(_canvas));
    },
    onMouseDown(mouseEvent) {

    },
    onMouseUp(mouseEvent) {

    },
    onMouseMove(mouseEvent) {
      // const { clientX: left, clientY: top } = mouseEvent;
      // const gl = canvas.getContext('webgl');
      // gl.readPixels(left, top, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      // console.log(left, top, pixel);
    }
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);
