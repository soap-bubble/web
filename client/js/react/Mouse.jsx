import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state) {
  const style = gameSelectors.style(state);
  const canvas = gameSelectors.canvas(state);

  return {
    style,
    canvas,
  };
}

const MousePresentation = ({
  style,
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
      ...style,
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
