import React, { PropTypes } from 'react';

const Scene = ({
  width,
  height,
  id,
  createAction,
  onMouseUp,
  onMouseMove,
  onMouseDown,
}) => (
  <canvas
    ref={createAction}
    width={width}
    height={height}
    id={id}
    onMouseUp={onMouseUp}
    onMouseMove={onMouseMove}
    onMouseDown={onMouseDown}
  />
);

Scene.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  id: PropTypes.number,
  createAction: PropTypes.func.isRequired,
  onMouseUp: PropTypes.func.isRequired,
  onMouseMove: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
};

export default Scene;
