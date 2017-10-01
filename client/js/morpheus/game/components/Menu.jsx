import React from 'react';
import MenuList from '../containers/MenuList';
import './Modal.scss';

const Modal = () => (
  <div className="container">
    <div className="modalBorder">
      <MenuList />
    </div>
  </div>
  );

export default Modal;
