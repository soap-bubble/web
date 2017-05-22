import { connect } from 'react-redux';
import React from 'react';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
// import Tools from './Tools';
import Mouse from './Mouse';

function mapStateToProps(state) {
  return {
    currentScenes: sceneSelectors.currentScenes(state),
  };
}

const World = ({
  currentScenes,
}) => {
  return (
    <div>
      {currentScenes}
      <Mouse />
      { /* process.env.NODE_ENV !== 'production' ? <Tools /> : null */ }
    </div>
  );
};

World.displayName = 'World';

export default connect(
  mapStateToProps,
)(World);
