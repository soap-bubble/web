import React from "react";

import VolumeSlider from "../containers/VolumeSlider";
import styles from "./Settings.module.css";

const Settings = ({
  onClose,
  onFullscreen,
}: {
  onClose: () => void;
  onFullscreen: () => void;
}) => (
  <div className={styles.settingsModal}>
    <span className={styles.settingsCloseButton}>
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
);

export default Settings;
