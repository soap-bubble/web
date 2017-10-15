import React from 'react';
import PropTypes from 'prop-types';
import { login } from 'soapbubble';
import './Login.scss';

const Login = ({
  onLogin,
}) => (<div className="loginModal">
  <login.Google onLogin={onLogin} />
</div>);

Login.propTypes = {
  onLogin: PropTypes.func,
};

Login.defaultProps = {
  onLogin: () => {},
};

export default Login;
