import React from 'react';
import { redirect } from 'react-isomorphic-render'
import { connect } from 'react-redux';
// import GoogleLogin from 'react-google-login';
import { Button } from 'react-bootstrap';
import config from '../config';
import GoogleLogin from '../modules/Login/containers/Google'

import {
  selectors as loginSelectors,
  actions as loginActions,
} from '../modules/Login';

class Settings extends React.Component {
  render() {
    const { isLoggedIn, onSignOut } = this.props
    if (isLoggedIn) {
      return <div
        className="container"
      >
        <div className="centered">
          <Button onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>;
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
    onSignOut() {
      dispatch(loginActions.logout());
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);
