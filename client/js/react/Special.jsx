import { connect } from 'react-redux';
import React from 'react';
import {
  each,
} from 'lodash';

import flatspot from '../morpheus/flatspot';
import store from '../store';
import {
  setHoverIndex,
  activateHotspotIndex,
} from '../actions/hotspots';
import {
  specialImgIsLoaded,
  specialCanvasCreated,
  generateHitCanvas,
  generateControlledFrames,
  generateSpecialImages,
} from '../actions/special';

const ORIGINAL_HEIGHT = 480;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

function mapStateToProps({ special, dimensions }) {
  const {
    url: backgroundUrl,
    canvas,
  } = special;
  const {
    width,
    height,
  } = dimensions;

  return {
    backgroundUrl,
    width,
    height,
    canvas,
  };
}

function mapDispatchToProps(dispatch) {
  let canvas;
  function onWindowResize() {
    if (canvas) {
      dispatch(generateControlledFrames());
      dispatch(generateSpecialImages());
    }
  }

  return {
    onImgIsLoaded(imgEl) {
      dispatch(specialImgIsLoaded());
      onWindowResize();
    },
    onCanvasCreate(_canvas) {
      if (_canvas) {
        window.addEventListener('resize', onWindowResize);
        canvas = _canvas;
        dispatch(specialCanvasCreated(canvas));
        dispatch(generateSpecialImages());
        flatspot(dispatch);
      } else {
        window.removeEventListener('resize', onWindowResize);
      }

    },
  };
}

const Special = connect(
  mapStateToProps,
  mapDispatchToProps,
)(({
  onCanvasCreate,
  backgroundUrl,
  onImgIsLoaded,
  width,
  height,
}) => (
  <div>
    <img
      style={{
        objectFit: 'cover',
        position: 'absolute',
      }}
      role="presentation"
      onLoad={onImgIsLoaded}
      src={backgroundUrl}
      width={width}
      height={height}
    />
    <canvas
      ref={onCanvasCreate}
      width={width}
      height={height}
    />
  </div>
));

export default Special;
