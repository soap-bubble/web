import { connect } from 'react-redux';
import React from 'react';
import flatspot from 'morpheus/flatspot';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';

function mapStateToProps(state, { scene }) {
  return {
    canvas: castSelectors.special.forScene(scene).canvas(state),
    videos: castSelectors.special.forScene(scene).videos(state),
    isCurrent: sceneSelectors.currentSceneData(state) === scene,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

const Special = connect(
  mapStateToProps,
)(({
  canvas,
  videos,
  isCurrent,
  dispatch,
}) => (
  <div ref={(el) => {
    if (el) {
      el.appendChild(canvas);
      videos.forEach(video => el.appendChild(video));
      if (isCurrent)
        flatspot(dispatch);
    }
  }} style={{
    width: '100%',
    height: '100%',
  }}/>
));

export default Special;
