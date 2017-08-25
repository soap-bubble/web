import { connect } from 'react-redux';
import React from 'react';
import flatspot from 'morpheus/flatspot';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state, { scene }) {
  const selector = castSelectors.forScene(scene);
  return {
    canvas: selector.special.canvas(state),
    videos: selector.special.videos(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
  };
}

function mapDispatchToProps(dispatch, { scene }) {
  return flatspot({ dispatch, scene });
}

const Special = connect(
  mapStateToProps,
  mapDispatchToProps,
)(({
  canvas,
  videos,
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
    ref={(el) => {
      if (el) {
        if (canvas) {
          el.appendChild(canvas);
        }
        if (videos) {
          videos.forEach(video => el.appendChild(video.el));
        }
      }
    }}
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
  />
));

export default Special;
