import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import styles from './GoogleLogin.css';
import googleIcon from './google.svg';

class GoogleLogin extends React.Component {
  constructor() {
    super();
    this.onClickHandler = this.onClickHandler.bind(this);
  }

  onClickHandler() {
    const options = {
      prompt: '',
    };
    const auth2 = global.gapi.auth2.getAuthInstance();
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
      <button type="button" className={cn(styles.root)} onClick={this.onClickHandler}>
        <span className={cn(styles.icon)}>
          
        </span>
        <span className={cn(styles.text)}>
          Sign In with Google
        </span>
      </button>
    );
  }
}

GoogleLogin.propTypes = {
  onFailure: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default GoogleLogin;
