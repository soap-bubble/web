import React from 'react'
import PropTypes from 'prop-types'

import VolumeSlider from '../containers/VolumeSlider'

const settingsModalStyle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: 10,
  padding: 20,
  backgroundColor: '#444',
  width: '20em',
  height: '10em',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}

const settingsCloseButtonStyle: React.CSSProperties = {
  cursor: 'pointer',
  userSelect: 'none',
  fontWeight: 'bold',
  fontSize: 22,
}

const Settings = ({
  onClose,
  onFullscreen,
}: {
  onClose: () => void
  onFullscreen: () => void
}) => (
  <div style={settingsModalStyle}>
    <span className="pull-right" style={settingsCloseButtonStyle}>
      <button
        onClick={onClose}
        type="button"
        className="close"
        aria-label="Close"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </span>
    <button
      onClick={onFullscreen}
      type="button"
      className="btn"
      aria-label="Fullscreen"
    >
      Fullscreen
    </button>
    <h4>Volume</h4>
    <VolumeSlider />
  </div>
)

Settings.propTypes = {
  onClose: PropTypes.func.isRequired,
  onFullscreen: PropTypes.func.isRequired,
}

Settings.defaultProps = {}

export default Settings
