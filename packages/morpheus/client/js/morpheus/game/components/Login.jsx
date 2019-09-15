import React, { useCallback } from 'react'
import Button from '@material-ui/core/Button'

const Login = ({ onLogin, provider }) => {
  const doLogin = useCallback(async () => {
    // await auth().setPersistence(auth.Auth.Persistence.LOCAL)
    try {
      const result = await firebase.auth().signInWithPopup(provider)
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
  }, [onLogin, provider])
  return (
    <Button onClick={doLogin} color="inherit">
      Login
    </Button>
  )
}

export default Login
