import { connect } from 'react-redux';
import {
  fetchScene,
  canvasCreated,
} from '../../actions/scene';
import {
  sceneCreate,
} from '../../actions/pano';
import Canvas from '../presentations/Canvas';
import momentum from '../../morpheus/momentum';

function mapStateToProps({ scene, dimensions }) {
  const {
    current: id,
    data,
    interaction,
    interactionMomemtum,
  } = scene || {};
  const { width, height } = dimensions;
  return {
    id,
    data,
    width,
    height,
  };
}

function mapDisptachToProps(dispatch) {
  return Object.assign({
    fetchScene(id) {
      dispatch(fetchScene(id))
        .then(() => {
          dispatch(sceneCreate());
        });
    },
    createAction(canvas) {
      dispatch(canvasCreated(canvas));
    }
  }, momentum(dispatch));
}

const Scene = connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);

export default Scene;
