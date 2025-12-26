import React from 'react'
import PropTypes from 'prop-types'
import Login from './Login'

const loginModalStyle = {
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

const LoginModal = ({ onLogin }) => (
  <div style={loginModalStyle}>
    <Login onLogin={onLogin} />
  </div>
)

LoginModal.propTypes = {
  onLogin: PropTypes.func,
}

LoginModal.defaultProps = {
  onLogin: () => {},
}

export default LoginModal
