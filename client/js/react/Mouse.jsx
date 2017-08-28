import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import input from 'morpheus/input';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state) {
  const width = gameSelectors.width(state);
  const height = gameSelectors.height(state);
  const cursor = gameSelectors.morpheusCursor(state);
  const canvas = gameSelectors.canvas(state);

  return {
    width,
    height,
    cursor,
    canvas,
  };
}

const MousePresentation = ({
  width,
  height,
  canvas,
}) => (
  <div
    ref={(el) => {
      if (el) {
        el.appendChild(canvas);
      }
    }}
    id="mouse"
    style={{
      width,
      height,
      left: '0px',
      top: '0px',
      'pointer-events': 'none',
    }}
  />
);

MousePresentation.propTypes = {
  canvas: PropTypes.instanceOf(HTMLCanvasElement).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default connect(
  mapStateToProps,
)(MousePresentation);
