import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'

const Login = ({ onLogin }) => {
  const doLogin = useCallback(async () => {
    try {
      const result = await firebase
        .auth()
        .signInWithPopup(new firebase.auth.GoogleAuthProvider())
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = result && result.credential
      // The signed-in user info.
      const user = result.user
      if (user && credential) {
        onLogin(user, credential)
      }
    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code
      const errorMessage = error.message
      // The email of the user's account used.
      const email = error.email
      // The firebase.auth.AuthCredential type that was used.
      const credential = error.credential
      console.error(errorCode, errorMessage, email, credential)
    }
  }, [onLogin])
  return (
    <Button onClick={doLogin} color="inherit">
      Login
    </Button>
  )
}

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    onLogin() {
      dispatch({
        type: 'route/EXAMPLES',
      })
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login)
