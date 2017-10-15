import { connect } from 'react-redux';
import cn from 'classnames';
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
    style: gameSelectors.style(state),
  };
}

function mapDispatchToProps(dispatch, { scene }) {
  return flatspot({ dispatch, scene });
}

const Special = connect(
  mapStateToProps,
  mapDispatchToProps,
)(({
  style,
  canvas,
  videos,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchMove,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
}) => (
  <div
    className={cn('scene')}
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
      ...style,
      cursor: 'none',
    }}
  />
));

export default Special;
