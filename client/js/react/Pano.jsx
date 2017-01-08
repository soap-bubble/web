import React from 'react';
import { connect } from 'react-redux';

import {
  fetchScene,
} from '../actions/scene';
import {
  canvasCreated,
  sceneCreate,
} from '../actions/pano';
import Canvas from './Canvas';
import momentum from '../morpheus/momentum';

function mapStateToProps({ scene, dimensions }) {
  const {
    current: id,
  } = scene || {};
  const { width, height } = dimensions;
  return {
    id,
    width,
    height,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    installInteractionHandlers() {
      momentum(dispatch);
    },
    createAction(canvas) {
      dispatch(canvasCreated(canvas));
    }
  };
}

const Pano = connect(
  mapStateToProps,
  mapDisptachToProps,
)(class extends React.Component {
  componentDidMount() {
    this.props.installInteractionHandlers();
  }

  render() {
    const {
      id,
      width,
      height,
      createAction,
    } = this.props;
    return (
      <Canvas
        id={id}
        width={width}
        height={height}
        createAction={createAction}
      />
    );
  }
});

export default Pano;
