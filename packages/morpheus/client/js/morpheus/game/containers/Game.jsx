import { connect } from 'react-redux';
import React from 'react';
import PropTypes from 'prop-types';
import Mouse from 'react/Mouse';
import castFactory from 'morpheus/casts/factory';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  Main,
  selectors as titleSelectors,
} from 'morpheus/title';
import Menu from '../components/Menu';
import Login from './Login';
import Settings from './Settings';
import SaveList from './SaveList';

function mapStateToProps(state) {
  return {
    inTitle: !titleSelectors.isDone(state),
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
  style,
  menuOpen,
  settingsOpen,
  saveOpen,
  isLoggingIn,
  inTitle,
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
  return (<div style={style}>
    { inTitle ? null : casts}
    { inTitle ? <Main /> : null }
    { inTitle ? null : <Mouse />}
    {menu}
  </div>);
};

Game.propTypes = {
  isLoggingIn: PropTypes.bool.isRequired,
  inTitle: PropTypes.bool.isRequired,
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
