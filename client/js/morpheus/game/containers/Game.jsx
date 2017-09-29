import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Mouse from 'react/Mouse';
import castFactory from 'morpheus/casts/factory';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

function mapStateToProps(state) {
  return {
    casts: castFactory(state),
    style: gameSelectors.style(state),
  };
}

function mapDispatchToProps(/* dispatch */) {
  return {

  };
}

const Game = ({
  casts,
  style,
}) => (
  <div style={style}>
    {casts}
    <Mouse />
  </div>
  );

Game.propTypes = {
  casts: PropTypes.arrayOf(PropTypes.element).isRequired,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

Game.defaultProps = {
  style: {},
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Game);
