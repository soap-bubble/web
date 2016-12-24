import { connect } from 'react-redux';
import {
  fetchScene,
  canvasCreated,
  onMouseUp,
  onMouseMove,
  onMouseDown,
  updateMomentum,
  updateMomentumInterval,
} from '../../actions/scene';
import { sceneCreate } from '../../actions/three';
import Canvas from '../presentations/Canvas';
import store from '../../store';

store.subscribe(() => {
  const { scene } = store.getState();
  const { needsMomomentum, mometumIntervalId } = scene;
  if (needsMomomentum === true && !mometumIntervalId) {
    const mometumIntervalId = setInterval(() => {
      store.dispatch(updateMomentum());
    }, 25);
    store.dispatch(updateMomentumInterval(mometumIntervalId));
  }
})

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
    onMouseDown(mouseEvent) {
      const { clientX: left, clientY: top } = mouseEvent;
      dispatch(onMouseDown({ top, left }));
    },
    onMouseMove(mouseEvent) {
      if (store.getState().scene.interaction) {
        const { clientX: left, clientY: top } = mouseEvent;
        dispatch(onMouseMove({ top, left }));
      }
    },
    onMouseUp(mouseEvent) {
      const { clientX: left, clientY: top } = mouseEvent;
      dispatch(onMouseUp({ top, left }));
    }
  };
}

const Scene = connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);

export default Scene;
