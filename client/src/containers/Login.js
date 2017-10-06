import React from 'react';
import { redirect } from 'react-isomorphic-render';
import { connect } from 'react-redux';
// import GoogleLogin from 'react-google-login';
import { Button } from 'react-bootstrap';
import config from '../config';
import GoogleLogin from '../modules/Login/containers/Google';

import {
  selectors as loginSelectors,
  actions as loginActions,
} from '../modules/Login';

class Login extends React.Component {
  componentDidUpdate() {
    const { isLoggedIn, handleLoggedIn } = this.props;

    if (isLoggedIn) {
      handleLoggedIn();
    }
  }

  render() {
    const { isLoggedIn } = this.props;
    if (!isLoggedIn) {
      return (<div
        className="container"
      >
        <div className="centered">
          <GoogleLogin />
        </div>
      </div>);
    }
    return null;
  }
}

function mapStateToProps(state) {
  const isLoggedIn = loginSelectors.isLoggedIn(state);
  return {
    isLoggedIn,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleLoggedIn() {
      dispatch(redirect('/examples'));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login);
