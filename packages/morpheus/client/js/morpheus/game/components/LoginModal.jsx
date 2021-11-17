import React from 'react'
import PropTypes from 'prop-types'
import Login from './Login'
import './LoginModal.css'

const Login = ({ onLogin }) => (
  <div className="loginModal">
    <Login onLogin={onLogin} />
  </div>
)

Login.propTypes = {
  onLogin: PropTypes.func,
}

Login.defaultProps = {
  onLogin: () => {},
}

export default Login
