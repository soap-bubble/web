import React from 'react';
import { connect } from 'react-redux';
import GoogleLogin from 'react-google-login';
import {
  selectors as loginSelectors,
  actions as loginActions,
} from '../modules/Login';

const Login = ({
  init,
  isInit,
  googleClientId,
}) => (<div
  className="container"
  ref={(el) => {
    if (el && !isInit) {
      init();
    }
  }}
>
  <div className="centered">
    {isInit ? <GoogleLogin clientId={googleClientId} buttonText="Login with Google" /> : null}
  </div>

</div>);

Login.propTypes = {
  init: React.PropTypes.func.isRequired,
  isInit: React.PropTypes.bool.isRequired,
  googleClientId: React.PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {
    isInit: loginSelectors.isInit(state),
    googleClientId: loginSelectors.googleClientId(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    init() {
      dispatch(loginActions.init());
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login);
