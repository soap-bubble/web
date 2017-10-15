import { connect } from 'react-redux';
import {
  loggedIn,
} from '../actions';
import Login from '../components/Login';

function mapStateToProps(state) {
  return state;
}

function mapDispatchToPros(dispatch) {
  return {
    onLogin() {
      dispatch(loggedIn());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(Login);
