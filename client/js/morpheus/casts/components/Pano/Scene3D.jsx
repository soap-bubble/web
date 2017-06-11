import { connect } from 'react-redux';
import momentum from 'morpheus/momentum';
import {
  actions as castActions,
} from 'morpheus/casts';
import {
  hotspot as hotspotSelectors,
} from 'morpheus/casts/selectors';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';

import store from 'store';
import Canvas from 'react/Canvas';

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
        dispatch(castActions.pano.canvasRef(canvas));
        if (hotspotSelectors.isPano(store.getState())) {
          momentum(dispatch);
        }
      }
    },
  };
}

const Pano = connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);

export default Pano;
