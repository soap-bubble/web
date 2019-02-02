import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Nav } from 'react-bootstrap';
import LoggedIn from '../components/LoggedIn';

const LoggedStatusNavItem = ({
  isCheckingLogin,
  isLoggedIn,
  userName,
}) => {
  if (isCheckingLogin) {
    return <Nav.Item>Checking...</Nav.Item>;
  } else if (isLoggedIn) {
    return (<LinkContainer to={'/settings'}>
      <Nav.Link>
        <LoggedIn name={userName} />
      </Nav.Link>
    </LinkContainer>);
  }
  return (<LinkContainer to={'/login'}>
    <Nav.Link>Login</Nav.Link>
  </LinkContainer>);
};

export default LoggedStatusNavItem;
