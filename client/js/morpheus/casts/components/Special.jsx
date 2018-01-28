import { connect } from 'react-redux';
import cn from 'classnames';
import React, { Component } from 'react';
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

class Special extends Component {
  componentDidMount() {
    const {
      canvas,
      videos,
    } = this.props;

    if (canvas) {
      this.el.appendChild(canvas);
    }
    if (videos) {
      videos.forEach(video => this.el.appendChild(video.el));
    }
  }

  componentWillUnmount() {
    const {
      canvas,
      videos,
    } = this.props;

    if (canvas) {
      canvas.remove();
    }
    if (videos) {
      videos.forEach(video => video.el.remove());
    }
  }

  render() {
    const {
      style,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onTouchMove,
      onTouchStart,
      onTouchEnd,
      onTouchCancel,
    } = this.props;

    return (
      <div
        className={cn('scene')}
        ref={(el) => {
          this.el = el;
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
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Special);
