import React, { PropTypes } from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';

function mapStateToProps({ ui, dimensions, hotspots }) {
  const {
    onMouseUp: onMouseUpCallbacks,
    onMouseMove: onMouseMoveCallbacks,
    onMouseDown: onMouseDownCallbacks,
    onTouchStart: onTouchStartCallbacks,
    onTouchMove: onTouchMoveCallbacks,
    onTouchEnd: onTouchEndCallbacks,
    onTouchCancel: onTouchCancelCallbacks,
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
    onTouchStart(touchEvent) {
      onTouchStartCallbacks.forEach(c => c(touchEvent));
    },
    onTouchMove(touchEvent) {
      onTouchMoveCallbacks.forEach(c => c(touchEvent));
      touchEvent.preventDefault();
    },
    onTouchEnd(touchEvent) {
      onTouchEndCallbacks.forEach(c => c(touchEvent));
    },
    onTouchCancel(touchEvent) {
      onTouchCancel.forEach(c => c(touchEvent));
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
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
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
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    onTouchCancel={onTouchCancel}
  />
)

MousePresentation.propTypes = {
  onMouseUp: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseDown: PropTypes.func,
  onTouchStart: PropTypes.func,
  onTouchEnd: PropTypes.func,
  onTouchMove: PropTypes.func,
  onTouchCancel: PropTypes.func,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default connect(
  mapStateToProps,
)(MousePresentation);
