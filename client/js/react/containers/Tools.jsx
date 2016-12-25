import { connect } from 'react-redux';
import { setSensitivity } from '../../actions/scene';
import { positionCamera } from '../../actions/three';
import Tools from '../presentations/Tools';
import store from '../../store';

function mapStateToProps({ three, scene }) {
  const {
    camera
  } = three || {};

  const {
    sensitivity,
  } = scene;

  return {
    camera,
    sensitivity,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    setCameraPositionZ(z) {
      positionCamera({ z });
    },
    setSensitivity,
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(Tools);
