import { connect } from 'react-redux';

import Canvas from '../presentations/Canvas';
import {
  canvasCreated,
  sceneCreate,
} from '../../actions/hotspots';
import hotspots from '../../morpheus/hotspots';

function mapStateToProps({ dimensions }) {
  const { width, height } = dimensions;
  return {
    id: 'hotspots-hit',
    width,
    height,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    createAction(canvas) {
      dispatch(canvasCreated(canvas));
      hotspots({ dispatch, canvas });
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);
