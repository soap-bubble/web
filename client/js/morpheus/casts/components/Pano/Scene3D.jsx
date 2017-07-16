import { connect } from 'react-redux';

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
  const selector = castSelectors.forScene(scene);

  return {
    canvas: selector.pano.canvas(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
  };
}

function mapDisptachToProps(dispatch) {
  return {};
//  return momentum(dispatch);
  // if (hotspotSelectors.isPano(store.getState())) {
  //
  // }
  // return {};
}

const Pano = connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  canvas,
}) => {
  <div
    ref={(el) => {
      if (el) {
        el.appendChild(canvas)
      }
    }}
  />
});

export default Pano;
