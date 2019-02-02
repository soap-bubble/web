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
    collapseOnSelect
    bg="dark"
    variant="dark"
    sticky="top"
  >
    <Navbar.Brand>
      Soap Bubble
    </Navbar.Brand>
    <Navbar.Toggle />
    <Navbar.Collapse>
      <Nav className="mr-auto" onSelect={onPageChange} className="mr-auto">
        {page.available.map(({ label, route }) => (
          <LinkContainer key={`page:${route}`} to={`/${route}`}>
            <Nav.Link active={page.current.route === route ? true : undefined} eventKey={route}>{label}</Nav.Link>
          </LinkContainer>
        ))}
      </Nav>
      <Nav className="justify-content-end">
        {rightToolbar}
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

NavBar.propTypes = {
  onPageChange: PropTypes.func.isRequired,
  onInit: PropTypes.func,
  rightToolbar: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
  ]),
};

NavBar.defaultProps = {
  rightToolbar: '',
  onInit: () => {},
};

export default NavBar;
