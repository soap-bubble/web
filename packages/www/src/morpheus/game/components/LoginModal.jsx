import React from 'react'
import PropTypes from 'prop-types'
import Login from './Login'
import './LoginModal.css'

const LoginContainer = ({ onLogin }) => (
  <div className="loginModal">
    <Login onLogin={onLogin} />
  </div>
)

LoginContainer.propTypes = {
  onLogin: PropTypes.func,
}

LoginContainer.defaultProps = {
  onLogin: () => {},
}

export default LoginContainer
