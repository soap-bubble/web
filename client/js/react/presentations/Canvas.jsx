import React, { PropTypes } from 'react';

const Scene = ({
  width,
  height,
  id,
  createAction,
}) => (
  <canvas
    ref={createAction}
    width={width}
    height={height}
    id={id}
  />
);

Scene.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  id: PropTypes.number,
  createAction: PropTypes.func.isRequired,
};

export default Scene;
