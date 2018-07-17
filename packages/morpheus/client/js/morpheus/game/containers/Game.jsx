import { connect } from 'react-redux';
import React from 'react';
import PropTypes from 'prop-types';
import Mouse from 'react/Mouse';
import castFactory from 'morpheus/casts/factory';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import Menu from '../components/Menu';
import MenuButton from '../containers/MenuButton';
import Login from './Login';
import Settings from './Settings';
import SaveList from './SaveList';

function mapStateToProps(state) {
  return {
    casts: castFactory(state),
    style: gameSelectors.style(state),
    menuOpen: gameSelectors.menuOpened(state),
    settingsOpen: gameSelectors.settingsOpened(state),
    saveOpen: gameSelectors.saveOpened(state),
    isLoggingIn: gameSelectors.isLoggingIn(state),
  };
}

const Game = ({
  casts,
  className,
  style,
  menuOpen,
  settingsOpen,
  saveOpen,
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
  if (saveOpen) {
    menu.push(<SaveList />);
  }
  return (<div className={className} style={style}>
    {casts}
    <MenuButton />
    <Mouse />
    {menu}
  </div>);
};

Game.propTypes = {
  isLoggingIn: PropTypes.bool.isRequired,
  className: PropTypes.string,
  menuOpen: PropTypes.bool.isRequired,
  settingsOpen: PropTypes.bool.isRequired,
  saveOpen: PropTypes.bool.isRequired,
  casts: PropTypes.arrayOf(PropTypes.mixed).isRequired,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

Game.defaultProps = {
  style: {},
};

export default connect(
  mapStateToProps,
)(Game);
