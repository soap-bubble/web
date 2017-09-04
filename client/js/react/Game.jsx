import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import Mouse from 'react/Mouse';
import castFactory from 'morpheus/casts/factory';

function mapStateToProps(state) {
  return {
    casts: castFactory(state),
  };
}
// <Mouse />
const World = ({
  casts,
}) => (
  <div>
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
