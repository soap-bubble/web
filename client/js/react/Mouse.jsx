import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state) {
  const {
    onMouseUp: onMouseUpCallbacks,
    onMouseMove: onMouseMoveCallbacks,
    onMouseDown: onMouseDownCallbacks,
    onTouchStart: onTouchStartCallbacks,
    onTouchMove: onTouchMoveCallbacks,
    onTouchEnd: onTouchEndCallbacks,
    onTouchCancel: onTouchCancelCallbacks,
  } = gameSelectors.allMouseEvents(state);
  const width = gameSelectors.width(state);
  const height = gameSelectors.height(state);
  const cursor = gameSelectors.cursor(state);

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
      onTouchCancelCallbacks.forEach(c => c(touchEvent));
    },
    width,
    height,
    cursor,
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
  cursor,
}) => (
  <div
    id="mouse"
    style={{
      width,
      height,
      cursor,
    }}
    onMouseUp={onMouseUp}
    onMouseMove={onMouseMove}
    onMouseDown={onMouseDown}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    onTouchCancel={onTouchCancel}
  />
);

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
  cursor: PropTypes.string,
};

export default connect(
  mapStateToProps,
)(MousePresentation);
