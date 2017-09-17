import React from 'react';
import {
  once,
} from 'lodash';
import { connect } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import { NavItem } from 'react-bootstrap';
import NavBar from '../components/NavBar';
import LoginStatusNavItem from '../components/LoginStatusNavItem';
import { changePage } from '../actions';
import {
  selectors as loginSelectors,
  actions as loginActions,
} from '../modules/Login';

let onInit;

const mapStateToProps = (state) => {
  const { page, product } = state;
  const isLoggedIn = loginSelectors.isLoggedIn(state);
  const isCheckingLogin = loginSelectors.isCheckingLogin(state);
  const userName = loginSelectors.userName(state);

  return {
    page,
    product,
    rightToolbar:
      (<LoginStatusNavItem
        isCheckingLogin={isCheckingLogin}
        isLoggedIn={isLoggedIn}
        userName={userName}
      />),
  };
};

const mapDispatchToProps = dispatch => {
  if (!onInit) {
    onInit = once(() => {
      dispatch(loginActions.checkLoginStatus());
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
