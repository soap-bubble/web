import { connect } from 'react-redux';
import {
  canvasCreated,
} from '../actions';
import Title from '../components/Title';

function mapStateToProps(state, { opacity }) {
  return {
    opacity,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    canvasCreated(canvas, width, height, stream, fetchStream) {
      dispatch(canvasCreated(canvas, width, height, stream, fetchStream));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Title);
