import { connect } from 'react-redux';
import { positionCamera } from '../../actions/scene';
import { setSensitivity } from '../../actions/pano';
import { setHotspotsTheta } from '../../actions/hotspots';
import Tools from '../presentations/Tools';
import store from '../../store';

function mapStateToProps({ scene, pano, hotspots }) {
  const {
    camera,
  } = scene;

  const {
    sensitivity,
  } = pano;

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
