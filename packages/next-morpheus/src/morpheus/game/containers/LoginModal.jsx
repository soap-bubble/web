import { connect } from 'react-redux'
import { loggedIn } from '../actions'
import LoginModal from '../components/LoginModal'

function mapStateToProps(state) {
  return state
}

function mapDispatchToPros(dispatch) {
  return {
    onLogin(user) {
      dispatch(loggedIn(user))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToPros,
)(LoginModal)
