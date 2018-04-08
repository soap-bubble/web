import { connect } from 'react-redux';
import {
  isLeaving,
  titleStyle,
} from '../selectors';
import {
  done,
} from '../actions';
import Main from '../components/Main';

function mapStateToProps(state) {
  return {
    leaving: isLeaving(state),
    style: titleStyle(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    done() {
      dispatch(done());
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Main);
