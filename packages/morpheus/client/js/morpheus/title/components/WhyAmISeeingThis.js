import React from 'react';
import PropTypes from 'prop-types';

const WhyAmISeeingThis = ({
  reason,
}) => (
  <div className="why-am-i-seeing-this" title={reason} />
);

WhyAmISeeingThis.propTypes = {
  reason: PropTypes.string.isRequired,
};

export default WhyAmISeeingThis;
