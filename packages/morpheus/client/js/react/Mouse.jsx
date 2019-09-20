import React, { useEffect } from 'react';
import raf from 'raf';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  actions as gameActions,
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state) {
  return {
    style: gameSelectors.style(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    canvasCreated(canvas) {
      dispatch(gameActions.createUIOverlay(canvas));
    },
    updateCursor() {
      dispatch(gameActions.drawCursor());
    }
  }
}

const MousePresentation = ({
  style,
  updateCursor,
  canvasCreated,
  width = window.innerWidth,
  height = window.innerHeight,
}) => {
  useEffect(() => {
    let isActive = true;
    const loop = () => {
      if (isActive) {
        updateCursor();
        raf(loop);
      }
    }
    raf(loop);
    return () => { isActive = false };
  }, []);
  return (
    <canvas
      ref={canvasCreated}
      id="mouse"
      width={width}
      height={height}
      style={{
        ...style,
        pointerEvents: 'none',
      }}
    />
  )
}

MousePresentation.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MousePresentation);
