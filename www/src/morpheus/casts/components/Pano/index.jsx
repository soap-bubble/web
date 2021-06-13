import { connect } from 'react-redux';
import React, { PureComponent } from 'react';
import cn from 'classnames';
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  actions as inputActions,
} from 'morpheus/input';
import {
  momentum,
  pano as hotspots,
} from 'morpheus/hotspot';
import qs from 'query-string';

const transparentPano = qs.parse(location.search).transparentPano;

function mapStateToProps(state, { scene }) {
  const selector = castSelectors.forScene(scene).cache();
  const canvas = selector.pano.webgl.canvas;
  const style = gameSelectors.style(state);
  const inputHandler = selector.pano.inputHandler;

  return {
    style,
    canvas,
    ...inputHandler,
  };
}

function mapDispatchToProps(dispatch, { scene }) {
  return {
    onKeyDown(event) {
      dispatch(inputActions.keyPress(event.which));
    },
  };
}

class Pano extends PureComponent {
  render() {
    const {
      scene,
      style,
      canvas,
      onMouseUp,
      onMouseMove,
      onMouseDown,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      onKeyDown,
    } = this.props;
    return (
      <div
        className={cn('scene')}
        id={scene.sceneId}
        ref={(el) => {
          if (el) {
            el.appendChild(canvas);
            el.addEventListener('touchstart', onTouchStart, { passive: false });
            el.addEventListener('touchmove', onTouchMove, { passive: false });
            this.el = el;
          } else {
            this.el.removeEventListener('touchstart', onTouchStart);
            this.el.removeEventListener('touchmove', onTouchMove);
            this.el = null;
          }
        }}

        style={{
          ...style,
          cursor: 'none',
          opacity: transparentPano ? 0.5 : null,
        }}
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      />
    );
  }
}

Pano.propTypes = {

};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Pano);
