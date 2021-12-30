import React from "react";
import PropTypes from "prop-types";

import styles from "./WhyAmISeeingThis.module.css";

const WhyAmISeeingThis = ({ reason }) => (
  <div className={styles.whyAmISeeingThis} title={reason} />
);

WhyAmISeeingThis.propTypes = {
  reason: PropTypes.string.isRequired,
};

export default WhyAmISeeingThis;
