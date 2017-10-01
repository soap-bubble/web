import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Mouse from 'react/Mouse';
import castFactory from 'morpheus/casts/factory';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import Menu from '../components/Menu';

function mapStateToProps(state) {
  return {
    casts: castFactory(state),
    style: gameSelectors.style(state),
    menuOpen: gameSelectors.menuOpened(state),
  };
}

const Game = ({
  casts,
  style,
  menuOpen,
}) => (
  <div style={style}>
    {casts}
    <Mouse />
    {menuOpen ? <Menu /> : null}
  </div>
  );

Game.propTypes = {
  menuOpen: PropTypes.bool.isRequired,
  casts: PropTypes.arrayOf(PropTypes.element).isRequired,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

Game.defaultProps = {
  style: {},
};

export default connect(
  mapStateToProps,
)(Game);
