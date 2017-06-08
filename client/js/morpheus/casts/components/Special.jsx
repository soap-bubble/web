import { connect } from 'react-redux';
import React from 'react';
import flatspot from 'morpheus/flatspot';
import {
  actions as specialActions,
  selectors as specialSelectors,
} from 'morpheus/special';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state) {
  return {
    backgroundUrl: specialSelectors.url(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
    canvas: specialSelectors.canvas(state),
  };
}

function mapDispatchToProps(dispatch) {
  let canvas;
  function onWindowResize() {
    if (canvas) {
      dispatch(specialActions.generateControlledFrames());
      dispatch(specialActions.generateSpecialImages());
    }
  }

  return {
    onImgIsLoaded() {
      dispatch(specialActions.specialImgIsLoaded());
      onWindowResize();
    },
    onCanvasCreate(_canvas) {
      if (_canvas) {
        window.addEventListener('resize', onWindowResize);
        canvas = _canvas;
        dispatch(specialActions.specialCanvasCreated(canvas));
        dispatch(specialActions.generateSpecialImages());
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
