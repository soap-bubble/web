import React from 'react';
import PropTypes from 'prop-types';

const LoggedIn = ({
  name,
}) => (<div>
  Hi {name}!
</div>);

LoggedIn.propTypes = {
  name: PropTypes.string,
};

LoggedIn.defaultProps = {
  name: 'Anonymous',
};

export default LoggedIn;
