import React from 'react';
import PropTypes from 'prop-types';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const NavBar = ({ onInit, page, onPageChange, rightToolbar }) => (
  <Navbar
    ref={(el) => {
      if (el) {
        onInit();
      }
    }}
    inverse
    collapseOnSelect
  >
    <Navbar.Header>
      <Navbar.Brand>
        <a href="/about">Soapbubble</a>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav pullRight>
        {rightToolbar}
      </Nav>
      <Nav onSelect={onPageChange}>
        {page.available.map(({ label, route }) => (
          <LinkContainer key={`page:${route}`} to={`/${route}`}>
            <NavItem active={page.current.route === route} eventKey={route}>{label}</NavItem>
          </LinkContainer>
        ))}
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

NavBar.propTypes = {
  page: PropTypes.string,
  onPageChange: PropTypes.func.isRequired,
  onInit: PropTypes.func,
  rightToolbar: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
  ]),
};

NavBar.defaultProps = {
  page: '',
  rightToolbar: '',
  onInit: () => {},
};

export default NavBar;
