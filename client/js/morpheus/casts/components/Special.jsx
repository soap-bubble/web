import { connect } from 'react-redux';
import React from 'react';
import flatspot from 'morpheus/flatspot';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state) {
  return {
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
    canvas: castSelectors.special.canvas(state),
  };
}

const Special = connect(
  mapStateToProps,
)(({
  canvas,
  width,
  height,
}) => (
  <div ref={(el) => {
    if (el && canvas) {
      el.appendChild(canvas);
    }
  }} style={{
    width: '100%',
    height: '100%',
  }}/>
));

export default Special;
