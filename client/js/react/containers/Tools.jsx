import { connect } from 'react-redux';
import { setSensitivity, positionCamera } from '../../actions/scene';
import { setHotspotsTheta } from '../../actions/hotspots';
import Tools from '../presentations/Tools';
import store from '../../store';

function mapStateToProps({ scene, hotspots }) {
  const {
    camera,
    sensitivity,
  } = scene;

  const {
    theta: hotspotsTheta,
  } = hotspots;

  return {
    camera,
    sensitivity,
    hotspotsTheta,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    setCameraPositionZ(z) {
      dispatch(positionCamera({ z }));
    },
    setSensitivity(sensitivity) {
      dispatch(setSensitivity(sensitivity));
    },
    setHotspotsTheta(theta) {
      dispatch(setHotspotsTheta(theta));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(Tools);
