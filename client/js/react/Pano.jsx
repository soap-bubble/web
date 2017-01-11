import React from 'react';
import { connect } from 'react-redux';

import {
  fetchScene,
} from '../actions/scene';
import {
  canvasCreated,
  sceneCreate,
  display,
} from '../actions/pano';
import store from '../store';
import Canvas from './Canvas';
import momentum from '../morpheus/momentum';

function mapStateToProps({ scene, dimensions }) {
  const {
    current: id,
  } = scene || {};
  const { width, height } = dimensions;
  return {
    id,
    width,
    height,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    createAction(canvas) {
      dispatch(canvasCreated(canvas));
      if (store.getState().hotspots.isPano) {
        momentum(dispatch);
      }
      dispatch(display());
    }
  };
}

const Pano = connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);

export default Pano;
