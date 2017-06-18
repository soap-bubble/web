import React from 'react';
import { connect } from 'react-redux';
import store from 'store';
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import hotspots from 'morpheus/hotspots';
import Canvas from 'react/Canvas';

function mapStateToProps(state) {
  return {
    id: 'hotspots-hit',
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
    isPano: castSelectors.hotspot.isPano(state),
  };
}

function mapDisptachToProps(dispatch) {
  return {
    createAction(canvas) {
      if (canvas) {
        dispatch(castActions.hotspot.canvasRef(canvas));
        hotspots({ dispatch, canvas });
      }
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  id,
  width,
  height,
  createAction,
  isPano,
}) => {
  if (isPano) {
    return (<Canvas
      id={id}
      width={width}
      height={height}
      createAction={createAction}
    />);
  }
  return null;
});
