import { connect } from 'react-redux';
import React from 'react';
import Mouse from 'react/Mouse';
import castFactory from 'morpheus/casts/factory';

function mapStateToProps(state) {
  return {
    casts: castFactory(state),
  };
}

const World = ({
  casts,
}) => {
  return (
    <div>
      {casts}
      <Mouse />
      { /* process.env.NODE_ENV !== 'production' ? <Tools /> : null */ }
    </div>
  );
};


export default connect(
  mapStateToProps,
)(World);
