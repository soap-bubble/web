import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state) {
  const style = gameSelectors.style(state);
  const canvas = gameSelectors.canvas(state);
  const dimensions = gameSelectors.dimensions(state);
  if (dimensions && dimensions.width && dimensions.height) {
    if (dimensions.width !== canvas.width) {
      canvas.width = dimensions.width;
    }
    if (dimensions.height !== canvas.height) {
      canvas.height = dimensions.height;
    }
  }

  return {
    style,
    canvas,
  };
}

const MousePresentation = ({
  style,
  canvas,
  children,
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
  >
    {children}
  </div>
);

MousePresentation.propTypes = {
  canvas: PropTypes.instanceOf(HTMLCanvasElement).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default connect(
  mapStateToProps,
)(MousePresentation);
