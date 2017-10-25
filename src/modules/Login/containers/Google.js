import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

const window = global;

export default function (actions) {
  const loginActions = actions;

  class GoogleLogin extends React.Component {
    constructor() {
      super();
      this.onClickHandler = this.onClickHandler.bind(this);
    }

    componentWillMount() {
    }

    componentWillUnmount() {
    }

    onClickHandler() {
      const options = {
        prompt: '',
      };
      const auth2 = window.gapi.auth2.getAuthInstance();
      auth2
        .signIn(options)
        .then(
          res => this.handleSignInSuccess(res),
          err => this.props.onFailure(err),
        );
    }

    handleSignInSuccess(res) {
      /*
        offer renamed response keys to names that match use
      */
      const basicProfile = res.getBasicProfile();
      const authResponse = res.getAuthResponse();
      const tokenObj = authResponse;
      const tokenId = tokenObj.id_token;
      const accessToken = tokenObj.access_token;
      this.props.onSuccess({
        profile: {
          googleId: basicProfile.getId(),
          imageUrl: basicProfile.getImageUrl(),
          email: basicProfile.getEmail(),
          name: basicProfile.getName(),
        },
        tokenId,
        accessToken,
      });
    }

    render() {
      return (
        // <button className="googleSignIn" type="button" onClick={this.onClickHandler}>
        <button className="btn btn-block btn-social btn-gopogle" onClick={this.onClickHandler}>
          Login with Google
          <span className="fa fa-google" />
        </button>
      );
    }
  }

  GoogleLogin.propTypes = {
    onFailure: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
  };

  function mapStateToProps(/* state */) {
    return {
    };
  }

  function mapDispatchToProps(dispatch) {
    return {
      onSuccess(user) {
        dispatch(loginActions.googleLogin(user));
      },
      onFailure(err) {
        dispatch(loginActions.googleLoginError(err));
      },
    };
  }

  return connect(mapStateToProps, mapDispatchToProps)(GoogleLogin);
}
