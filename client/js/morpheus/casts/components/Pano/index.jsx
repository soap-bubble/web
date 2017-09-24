import { connect } from 'react-redux';
import React from 'react';
import cn from 'classnames';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import momentum from 'morpheus/momentum';
import hotspots from 'morpheus/hotspots';
import qs from 'query-string';

const transparentPano = qs.parse(location.search).transparentPano;

function mapStateToProps(state, { scene }) {
  const selector = castSelectors.forScene(scene);
  const canvas = selector.pano.canvas(state);
  const style = gameSelectors.style(state);

  return {
    canvas,
    style,
  };
}

function mapDispatchToProps(dispatch, { scene }) {
  const momentumHandler = momentum({ dispatch, scene });
  const hotspotsHandler = hotspots({ dispatch, scene });

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
  }, {});
}

const Pano = ({
  canvas,
  style,
  onMouseUp,
  onMouseMove,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
}) => (
  <div
    className={cn('scene')}
    ref={(el) => {
      if (el) {
        el.appendChild(canvas);
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
      opacity: transparentPano ? 0.5 : null,
    }}
  />
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Pano);
