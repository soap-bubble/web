import { connect } from 'react-redux';
import cn from 'classnames';
import React, { Component } from 'react';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  MenuButton,
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state, { scene }) {
  const selector = castSelectors.forScene(scene);
  return {
    canvas: selector.special.canvas(state),
    videos: selector.special.videos(state),
    style: gameSelectors.style(state),
    ...selector.special.inputHandler(state),
  };
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
          if (el) {
            el.addEventListener('touchstart', onTouchStart, { passive: false });
            el.addEventListener('touchmove', onTouchMove, { passive: false });
            this.el = el;
          } else {
            this.el.removeEventListener('touchstart', onTouchStart);
            this.el.removeEventListener('touchmove', onTouchMove);
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
      >
        <MenuButton
          el={(el) => {
            this.menu = el;
          }}
        />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(Special);
