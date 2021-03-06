import { once } from 'lodash'
import { connect } from 'react-redux'
import NavBar from '../components/NavBar'

let onInit

const mapStateToProps = state => {
  const {
    location: { type: page },
  } = state
  // const isLoggedIn = loginSelectors.isLoggedIn(state);
  // const isCheckingLogin = loginSelectors.isCheckingLogin(state);
  // const userName = loginSelectors.userName(state);

  return {
    page,
    // rightToolbar:
    //   (<LoginStatusNavItemContainer
    //     isCheckingLogin={isCheckingLogin}
    //     isLoggedIn={isLoggedIn}
    //     userName={userName}
    //   />),
  }
}

const mapDispatchToProps = dispatch => {
  if (!onInit) {
    onInit = once(() => {
      // dispatch(loginActions.init());
    })
  }
  return {
    onPageChange(page, e) {
      e.preventDefault()
      dispatch({
        type: page,
      })
    },
    onInit,
  }
}

const Header = connect(
  mapStateToProps,
  mapDispatchToProps,
)(NavBar)

export default Header
