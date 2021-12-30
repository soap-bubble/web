import { connect } from 'react-redux';
import {
  titleDimensions,
  titleStyle,
} from '../selectors';
import {
  canvasCreated,
} from '../actions';
import Title from '../components/Title';

function mapStateToProps(state, { opacity }) {
  return {
    opacity,
    style: titleStyle(state),
    ...titleDimensions(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    canvasCreated(canvas) {
      dispatch(canvasCreated(canvas));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Title);
