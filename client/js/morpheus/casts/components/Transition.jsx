import { curry } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import flatspot from 'morpheus/flatspot';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  selectors as castSelectors,
} from 'morpheus/casts';

function mapStateToProps(state, { scene }) {
  return {
    video: castSelectors.forScene(scene).transition.video(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
  };
}

function mapDispatchToProps(dispatch, { scene }) {
  return flatspot({ dispatch, scene });
}

function insertVideo(video, divEl) {
  if (divEl) {
    divEl.appendChild(video);
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(({
  video,
  width,
  height,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchMove,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
}) => (
  <div
    ref={curry(insertVideo)(video)}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    onTouchCancel={onTouchCancel}
    style={{
      width: `${width}px`,
      height: `${height}px`,
    }}
  />)
);
