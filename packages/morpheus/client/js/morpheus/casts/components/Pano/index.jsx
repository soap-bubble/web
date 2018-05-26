import { connect } from 'react-redux';
import React, { PureComponent } from 'react';
import cn from 'classnames';
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  MenuButton,
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
  const selector = castSelectors.forScene(scene);
  const canvas = selector.pano.canvas(state);
  const style = gameSelectors.style(state);

  return {
    style,
    canvas,
  };
}

function mapDispatchToProps(dispatch, { scene }) {
  const momentumHandler = momentum({ dispatch, scene });
  const hotspotsHandler = hotspots({ dispatch, scene });
  const actions = castActions.forScene(scene);

  return [
    'onMouseUp',
    'onMouseMove',
    'onMouseDown',
    'onTouchStart',
    'onTouchMove',
    'onTouchEnd',
    'onTouchCancel',
  ].reduce((memo, handler) => {
    memo[handler] = (event) => {
      hotspotsHandler[handler](event);
      momentumHandler[handler](event);
    };
    return memo;
  }, {
    onKeyDown(event) {
      dispatch(inputActions.keyPress(event.which));
    },
    onMount({
      canvas,
    }) {
      dispatch(castActions.lifecycle.onMount({
        scene,
        castType: 'pano',
        canvas,
      }));
    },
    onUnmount() {
      // dispatch(castActions.lifecycle.doUnload(scene));
    },
  });
}

class Pano extends PureComponent {

  componentWillUnmount() {
    const { onUnmount } = this.props;
    onUnmount();
  }

  render() {
    const {
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
        ref={(el) => {
          if (el) {
            el.insertBefore(canvas, this.menu);
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

Pano.propTypes = {

};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Pano);
