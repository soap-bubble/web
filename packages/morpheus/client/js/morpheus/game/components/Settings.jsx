import React from 'react';
import PropTypes from 'prop-types';

import VolumeSlider from '../containers/VolumeSlider';
import './Settings.scss';

const Settings = ({
  onClose,
}) => (<div className="settingsModal">

  <span
    className="pull-right settingsCloseButton"
  >
    <button onClick={onClose} type="button" className="close" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </span>


  <h4>Volume</h4>
  <VolumeSlider />
</div>);

Settings.propTypes = {
  onClose: PropTypes.func.isRequired,
};

Settings.defaultProps = {};

export default Settings;
