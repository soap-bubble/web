import React from 'react'
import MenuList from '../containers/MenuList'

const modalBorderStyle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: 10,
  padding: 20,
  backgroundColor: '#444',
  width: '20em',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}

const Modal = () => (
  <div className="container">
    <div style={modalBorderStyle}>
      <MenuList />
    </div>
  </div>
)

export default Modal
