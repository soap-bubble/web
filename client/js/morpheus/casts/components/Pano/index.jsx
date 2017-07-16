import { connect } from 'react-redux';
import React from 'react';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import momentum from 'morpheus/momentum';
import hotspots from 'morpheus/hotspots';
import Hotspots3D from './Hotspots3D';
import Scene3D from './Scene3D';

function mapStateToProps(state) {
  const selector = castSelectors.forScene(scene);

  return {
    canvas: selector.pano.canvas(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
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
  width,
  height,
  onMouseUp,
  onMouseMove,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
}) => {
  return (
    <div
      ref={(el) => {
        if (el) {
          el.appendChild(canvas)
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
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Pano);
