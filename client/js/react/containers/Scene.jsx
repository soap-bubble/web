import { connect } from 'react-redux';
import { fetchScene, canvasCreated, sceneCreate } from '../../actions/scene';
import Canvas from '../presentations/Canvas';

function mapStateToProps({ scene }) {
  const { current: id, data } = scene || {};
  return {
    id,
    data,
    width: 800,
    height: 480,
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
