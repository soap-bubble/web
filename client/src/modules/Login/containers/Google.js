import React from 'react';
import { connect } from 'react-redux';
import { goto } from 'react-isomorphic-render'
import {
  actions as loginActions,
} from '../index';
import config from '../../../config';

const window = global;

class GoogleLogin extends React.Component {
  constructor() {
    super()
    this.receiveMessage = this.receiveMessage.bind(this);
  }

  componentWillMount() {
    if (window.addEventListener) {
      window.addEventListener('message', this.receiveMessage, false);
    }
  }

  componentWillUnmount() {
    if (window.removeEventListener) {
      window.removeEventListener('message', this.receiveMessage);
    }
  }

  receiveMessage({ origin, data}) {
    if (origin !== config.authServer) {
      return;
    }
    const { isLoggedIn, user } = data;
    if (isLoggedIn) {
      const { handleLoggedIn } = this.props;
      if (handleLoggedIn) {
        handleLoggedIn(user);
      }
    }
  }

  render() {
    return <iframe ref={el => this.iframe = el} width="100%" frameBorder="0" seamless="seamless" className="centered" title="Sign in with Google" src={`${config.authServer}/login`} />
  }
}

function mapStateToProps(state) {
  return {
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleLoggedIn(user) {
      dispatch(loginActions.login(user));
      dispatch(goto('/examples'));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GoogleLogin);
