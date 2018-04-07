import { connect } from 'react-redux';
import {
  titleStyle,
} from '../selectors';
import {
  done,
  mouseClick,
} from '../actions';
import Main from '../components/Main';

function mapStateToProps(state) {
  return {
    style: titleStyle(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    mouseClick(canvas) {
      dispatch(mouseClick(canvas));
    },
    done() {
      dispatch(done());
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Main);
