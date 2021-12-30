import React from "react";
import PropTypes from "prop-types";

import styles from "./PlayOverlay.module.css";

const PlayOverlay = ({ onClick, children = null }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
    }}
  >
    <div className={styles.playBackground} />
    <div className={styles.playOverlay} onClick={onClick}>
      {children}
    </div>
  </div>
);

PlayOverlay.propTypes = {
  onClick: PropTypes.func,
};

export default PlayOverlay;
