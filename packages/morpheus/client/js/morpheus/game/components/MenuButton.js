import React from 'react';
import PropTypes from 'prop-types';
import gearUrl from '../../../../image/icon/gear.png';

const Menu = ({
  onMenuClick,
  isMenuClosed,
  el,
}) => (
  <img
    ref={el}
    src={gearUrl}
    alt="menu"
    className="menu"
    onClick={() => onMenuClick(isMenuClosed)}
  />
);

Menu.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  el: PropTypes.func.isRequired,
  isMenuClosed: PropTypes.bool.isRequired,
};

export default Menu;
