import React, { PropTypes } from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';

function mapStateToProps({ ui, dimensions }) {
  const {
    onMouseUp: onMouseUpCallbacks,
    onMouseMove: onMouseMoveCallbacks,
    onMouseDown: onMouseDownCallbacks,
  } = ui;
  const {
    width,
    height,
  } = dimensions;

  return {
    onMouseUp(mouseEvent) {
      onMouseUpCallbacks.forEach(c => c(mouseEvent));
    },
    onMouseMove(mouseEvent) {
      onMouseMoveCallbacks.forEach(c => c(mouseEvent));
    },
    onMouseDown(mouseEvent) {
      onMouseDownCallbacks.forEach(c => c(mouseEvent));
    },
    width,
    height,
  };
}

const MousePresentation = ({
  onMouseUp,
  onMouseMove,
  onMouseDown,
  width,
  height,
}) => (
  <div id="mouse"
    style={{
      width,
      height,
    }}
    onMouseUp={onMouseUp}
    onMouseMove={onMouseMove}
    onMouseDown={onMouseDown}
  />
)

MousePresentation.propTypes = {
  onMouseUp: PropTypes.array.isRequired,
  onMouseMove: PropTypes.array.isRequired,
  onMouseDown: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default connect(
  mapStateToProps,
)(MousePresentation);
