import React from "react";
import PropTypes from "prop-types";

const gearUrl = "/image/icon/gear.png";

const Menu = ({
  onMenuClick,
  isMenuClosed,
  onMouseMove,
  location,
  el,
}: any) => (
  <img
    ref={el}
    style={{
      top: location.y + 10,
      left: location.x + 10,
    }}
    src={gearUrl}
    alt="menu"
    className="menu"
    onClick={() => onMenuClick(isMenuClosed)}
    onMouseMove={onMouseMove}
  />
);

Menu.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  onMouseMove: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  el: PropTypes.func.isRequired,
  isMenuClosed: PropTypes.bool.isRequired,
};

export default Menu;
