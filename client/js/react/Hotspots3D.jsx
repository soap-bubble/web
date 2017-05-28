import React from 'react';
import { connect } from 'react-redux';
import store from 'store';
import {
  actions as hotspotActions,
  selectors as hotspotSelectors,
} from 'morpheus/hotspot';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import hotspots from 'morpheus/hotspots';
import Canvas from './Canvas';

function mapStateToProps(state) {
  return {
    id: 'hotspots-hit',
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
    hotspotsData: hotspotSelectors.data(state),
    isPano: hotspotSelectors.isPano(state),
  };
}

function mapDisptachToProps(dispatch) {
  return {
    createAction(canvas) {
      dispatch(hotspotActions.canvasCreated(canvas));
      if (store.getState().hotspot.isPano) {
        hotspots({ dispatch, canvas });
        dispatch(hotspotActions.display());
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
  hotspotsData,
  isPano,
}) => {
  if(hotspotsData.length && isPano) {
    return (<Canvas
      id={id}
      width={width}
      height={height}
      createAction={createAction}
    />);
  }
  return null;
});
