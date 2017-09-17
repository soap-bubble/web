import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { NavItem } from 'react-bootstrap';
import LoggedIn from '../components/LoggedIn';

const LoggedStatusNavItem = ({
  isCheckingLogin,
  isLoggedIn,
  userName,
}) => {
  if (isCheckingLogin) {
    return <NavItem>Checking...</NavItem>;
  } else if (isLoggedIn) {
    return <LinkContainer to={'/settings'}>
      <NavItem>
        <LoggedIn name={userName}/>
      </NavItem>
    </LinkContainer>;
  }
  return <LinkContainer to={'/login'}>
    <NavItem>Login</NavItem>
  </LinkContainer>;
}

export default LoggedStatusNavItem;
