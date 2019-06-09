import React from 'react';
import { connect } from 'react-redux';
import {
  login,
} from '../modules/soapbubble';

const {
  selectors: loginSelectors,
  Google: GoogleLogin,
} = login;

class Login extends React.Component {
  render() {
    const { isLoggedIn, handleLoggedIn } = this.props;
    if (!isLoggedIn) {
      return (<div
        className="container"
      >
        <div className="centered">
          <GoogleLogin onLogin={handleLoggedIn} />
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
      dispatch({
        type: 'route/EXAMPLES',
      });
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login);
