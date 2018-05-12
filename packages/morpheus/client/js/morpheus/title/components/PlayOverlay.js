import React from 'react';
import PropTypes from 'prop-types';

const PlayOverlay = ({
  onClick,
}) => (
  <div className="play-overlay" onClick={onClick} />
);

PlayOverlay.propTypes = {
  onClick: PropTypes.func,
};

export default PlayOverlay;
