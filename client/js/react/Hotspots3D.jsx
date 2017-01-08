import React from 'react';
import { connect } from 'react-redux';

import store from '../store';
import Canvas from './Canvas';
import {
  canvasCreated,
  sceneCreate,
} from '../actions/hotspots';
import hotspots from '../morpheus/hotspots';

function mapStateToProps({ hotspots, dimensions }) {
  const { width, height } = dimensions;
  const { data: hotspotsData, isPano } = hotspots;
  return {
    id: 'hotspots-hit',
    width,
    height,
    hotspotsData,
    isPano,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    createAction(canvas) {
      dispatch(canvasCreated(canvas));
      if (store.getState().hotspots.isPano) {
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
