import React from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'

class Settings extends React.Component {
  render() {
    const { isLoggedIn, onSignOut } = this.props
    if (isLoggedIn) {
      return (
        <div className="container">
          <div className="centered">
            <Button onClick={onSignOut}>Sign out</Button>
          </div>
        </div>
      )
    }
    return null
  }
}

function mapStateToProps(state) {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    onSignOut() {
      dispatch(loginActions.logout()).then(
        dispatch({
          type: 'route/EXAMPLES',
        }),
      )
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings)
