import { connect } from 'react-redux';
import GoogleLogin from '../components/GoogleLogin';

export default function (actions) {
  'ngInject';

  const loginActions = actions;


  function mapStateToProps(/* state */) {
    return {
    };
  }

  function mapDispatchToProps(dispatch, props) {
    const {
      onLogin = () => {},
    } = props;
    return {
      onSuccess(user) {
        dispatch(loginActions.googleLogin(user));
        onLogin(user);
      },
      onFailure(err) {
        dispatch(loginActions.googleLoginError(err));
      },
    };
  }

  return connect(mapStateToProps, mapDispatchToProps)(GoogleLogin);
}
