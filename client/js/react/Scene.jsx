import { connect } from 'react-redux';

import {
  fetchScene,
} from '../actions/scene';
import {
  canvasCreated,
  sceneCreate,
} from '../actions/pano';
import Canvas from './Canvas';
import momentum from '../morpheus/momentum';

function mapStateToProps({ scene, dimensions }) {
  const {
    current: id,
    data,
  } = scene || {};
  const { width, height } = dimensions;
  return {
    id,
    width,
    height,
  };
}

function mapDisptachToProps(dispatch) {
  momentum(dispatch);

  return {
    fetchScene(id) {
      dispatch(fetchScene(id))
        .then(() => {
          dispatch(sceneCreate());
        });
    },
    createAction(canvas) {
      dispatch(canvasCreated(canvas));
    }
  };
}

const Scene = connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);

export default Scene;
