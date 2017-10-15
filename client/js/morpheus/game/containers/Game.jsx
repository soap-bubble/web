import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Mouse from 'react/Mouse';
import castFactory from 'morpheus/casts/factory';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import Menu from '../components/Menu';
import Login from './Login';
import Settings from './Settings';

function mapStateToProps(state) {
  return {
    casts: castFactory(state),
    style: gameSelectors.style(state),
    menuOpen: gameSelectors.menuOpened(state),
    settingsOpen: gameSelectors.settingsOpened(state),
    isLoggingIn: gameSelectors.isLoggingIn(state),
  };
}

const Game = ({
  casts,
  style,
  menuOpen,
  settingsOpen,
  isLoggingIn,
}) => {
  const menu = [];
  if (menuOpen) {
    menu.push(<Menu />);
  }
  if (isLoggingIn) {
    menu.push(<Login />);
  }
  if (settingsOpen) {
    menu.push(<Settings />);
  }
  return (<div style={style}>
    {casts}
    <Mouse />
    {menu}
  </div>);
};

Game.propTypes = {
  isLoggingIn: PropTypes.bool.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  settingsOpen: PropTypes.bool.isRequired,
  casts: PropTypes.arrayOf(PropTypes.element).isRequired,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

Game.defaultProps = {
  style: {},
};

export default connect(
  mapStateToProps,
)(Game);
