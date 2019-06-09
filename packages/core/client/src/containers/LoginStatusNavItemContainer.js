import { connect } from 'react-redux';
import LoginStatusNavItem from '../components/LoginStatusNavItem';

export default connect(
  null,
  dispatch => ({
    toLogin() {
      dispatch({
        type: 'route/LOGIN',
      });
    },
    toSettings() {
      dispatch({
        type: 'route/SETTINGS',
      });
    },
  }),
)(LoginStatusNavItem);
