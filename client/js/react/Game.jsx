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
// <Mouse />
const World = ({
  casts,
  style,
}) => (
  <div style={style}>
    {casts}
    <Mouse />
  </div>
  );

World.propTypes = {
  casts: PropTypes.arrayOf(PropTypes.element).isRequired,
};

export default connect(
  mapStateToProps,
)(World);
