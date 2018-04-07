import React from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid';

const VolumeSlider = ({
  onChange,
  volume,
}) => {
  const listId = uuid();

  return (
    <div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={volume}
        list={listId}
        onChange={onChange}
      />
      <datalist id={listId}>
        <option value="0" label="0%" />
        <option value="10" />
        <option value="20" />
        <option value="30" />
        <option value="40" />
        <option value="50" label="50%" />
        <option value="60" />
        <option value="70" />
        <option value="80" />
        <option value="90" />
        <option value="100" label="100%" />
      </datalist>
    </div>
  );
};

VolumeSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  volume: PropTypes.number.isRequired,
};

export default VolumeSlider;
