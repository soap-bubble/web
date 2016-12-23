import { connect } from 'react-redux';
import { fetchScene, canvasCreated } from '../../actions/scene';
import { sceneCreate } from '../../actions/three';
import Canvas from '../presentations/Canvas';

function mapStateToProps({ scene, dimensions }) {
  const { current: id, data } = scene || {};
  const { width, height } = dimensions;
  return {
    id,
    data,
    width,
    height,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    fetchScene(id) {
      dispatch(fetchScene(id))
        .then(() => {
          dispatch(sceneCreate());
        });
    },
    createAction(canvas) {
      dispatch(canvasCreated(canvas));
    },

  };
}

const Scene = connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);

export default Scene;
