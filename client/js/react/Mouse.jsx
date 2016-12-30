import React, { PropTypes } from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';

function mapStateToProps({ ui, dimensions, hotspots }) {
  const {
    onMouseUp: onMouseUpCallbacks,
    onMouseMove: onMouseMoveCallbacks,
    onMouseDown: onMouseDownCallbacks,
  } = ui;
  const {
    width,
    height,
  } = dimensions;
  const {
    hoverIndex
  } = hotspots;

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
    hoverIndex,
  };
}

const MousePresentation = ({
  onMouseUp,
  onMouseMove,
  onMouseDown,
  width,
  height,
  hoverIndex,
}) => (
  <div id="mouse"
    style={{
      width,
      height,
      cursor: hoverIndex !== null ? 'pointer' : hoverIndex,
    }}
    onMouseUp={onMouseUp}
    onMouseMove={onMouseMove}
    onMouseDown={onMouseDown}
  />
)

MousePresentation.propTypes = {
  onMouseUp: PropTypes.func.isRequired,
  onMouseMove: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default connect(
  mapStateToProps,
)(MousePresentation);
