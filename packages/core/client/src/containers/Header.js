import React from 'react';
import {
  once,
} from 'lodash';
import { connect } from 'react-redux';
import NavBar from '../components/NavBar';
import LoginStatusNavItem from '../components/LoginStatusNavItem';
import { changePage } from '../actions';
import {
  login,
} from '../modules/soapbubble';

const {
  selectors: loginSelectors,
  actions: loginActions,
} = login;

let onInit;

const mapStateToProps = (state) => {
  const { page } = state;
  const isLoggedIn = loginSelectors.isLoggedIn(state);
  const isCheckingLogin = loginSelectors.isCheckingLogin(state);
  const userName = loginSelectors.userName(state);

  return {
    page,
    rightToolbar:
      (<LoginStatusNavItem
        isCheckingLogin={isCheckingLogin}
        isLoggedIn={isLoggedIn}
        userName={userName}
      />),
  };
};

const mapDispatchToProps = (dispatch) => {
  if (!onInit) {
    onInit = once(() => {
      dispatch(loginActions.init());
    });
  }
  return {
    onPageChange(page) {
      dispatch(changePage(page));
    },
    onInit,
  };
};

const Header = connect(
  mapStateToProps,
  mapDispatchToProps,
)(NavBar);

export default Header;
