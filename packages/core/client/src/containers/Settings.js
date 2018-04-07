import React from 'react';
import { redirect } from 'react-isomorphic-render'
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';
import config from '../config';
import {
  login,
} from '../modules/soapbubble';

const {
  selectors: loginSelectors,
  actions: loginActions,
} = login;

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
      dispatch(loginActions.logout())
        .then(dispatch(redirect('/')));
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);
