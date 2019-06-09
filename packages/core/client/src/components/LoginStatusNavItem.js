import React from 'react';
import { Nav } from 'react-bootstrap';
import LoggedIn from '../components/LoggedIn';

const LoggedStatusNavItem = ({
  isCheckingLogin,
  isLoggedIn,
  userName,
  toSettings,
  toLogin,
}) => {
  if (isCheckingLogin) {
    return <Nav.Item>Checking...</Nav.Item>;
  } else if (isLoggedIn) {
    return (
      <Nav.Link onClick={toSettings}>
        <LoggedIn name={userName} />
      </Nav.Link>
    );
  }
  return (
    <Nav.Link onClick={toLogin}>Login</Nav.Link>
  );
};

export default LoggedStatusNavItem;
