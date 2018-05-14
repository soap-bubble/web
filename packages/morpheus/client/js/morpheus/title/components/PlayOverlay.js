import React from 'react';
import PropTypes from 'prop-types';

const PlayOverlay = ({
  onClick,
  children = null,
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
    }}
  >
    <div className="play-background" />
    <div className="play-overlay" onClick={onClick}>
      {children}
    </div>
  </div>
);

PlayOverlay.propTypes = {
  onClick: PropTypes.func,
};

export default PlayOverlay;
