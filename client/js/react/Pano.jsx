import { connect } from 'react-redux';
import momentum from 'morpheus/momentum';
import {
  actions as panoActions,
} from 'morpheus/pano';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import store from 'store';
import Canvas from './Canvas';

function mapStateToProps(state) {
  return {
    id: sceneSelectors.currentSceneId(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
  };
}

function mapDisptachToProps(dispatch) {
  return {
    createAction(canvas) {
      if (canvas) {
        dispatch(panoActions.canvasCreated(canvas));
        if (store.getState().hotspot.isPano) {
          momentum(dispatch);
        }
        dispatch(panoActions.display());
      }
    },
  };
}

const Pano = connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);

export default Pano;
