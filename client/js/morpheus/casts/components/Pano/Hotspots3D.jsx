import React from 'react';
import { connect } from 'react-redux';
import store from 'store';
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import hotspots from 'morpheus/hotspots';
import Canvas from 'react/Canvas';

function mapStateToProps(state) {
  return {
    isPano: castSelectors.hotspot.isPano(state),
    canvas: castSelectors.hotspot.canvas(state),
  };
}

function mapDisptachToProps(dispatch) {
  return {
    createAction(canvas) {
      hotspots({ dispatch, canvas })
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  isPano,
  createAction,
  canvas,
}) => {
  if (isPano && canvas) {
    return (<div ref={(el) => {
      if (el) {
        el.appendChild(canvas);
        createAction(canvas);
      }
    }}></div>);
  }
  return null;
});
